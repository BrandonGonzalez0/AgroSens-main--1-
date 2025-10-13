// Worker que procesa ImageData en HSV y devuelve estadísticas resumidas
// Soporta tres modos:
// - default: devuelve estadísticas simples (plantPixels, redPixels, rgb sums)
// - heatmap: devuelve una cuadrícula Float32Array normalizada con puntajes de anomalía
// - ml: intenta cargar TensorFlow.js + mobilenet (vía importScripts CDN) y clasificar un resize 224x224

let tfLoaded = false;
let mobilenetModel = null;

self.onmessage = async function (e) {
  const { id, width, height, buffer, mode, gridW, gridH } = e.data || {};
  try {
    const data = new Uint8ClampedArray(buffer);
    let rSum = 0, gSum = 0, bSum = 0, count = 0;
    let plantPixels = 0, redPixels = 0;

    // Heatmap mode: downsample into gridW x gridH
    if (mode === 'heatmap' && gridW && gridH) {
      const grid = new Float32Array(gridW * gridH);
      for (let i = 0; i < grid.length; i++) grid[i] = 0;

      const cellW = Math.max(1, Math.floor(width / gridW));
      const cellH = Math.max(1, Math.floor(height / gridH));

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = (y * width + x) * 4;
          const r = data[idx] / 255;
          const g = data[idx+1] / 255;
          const b = data[idx+2] / 255;
          rSum += data[idx]; gSum += data[idx+1]; bSum += data[idx+2]; count++;

          const max = Math.max(r, g, b);
          const min = Math.min(r, g, b);
          const delta = max - min;
          let h = 0;
          if (delta !== 0) {
            if (max === r) h = ((g - b) / delta) % 6;
            else if (max === g) h = (b - r) / delta + 2;
            else h = (r - g) / delta + 4;
            h = Math.round(h * 60);
            if (h < 0) h += 360;
          }
          const s = max === 0 ? 0 : delta / max;
          const v = max;

          if (h >= 70 && h <= 160 && s > 0.2 && v > 0.05) plantPixels++;
          if ((h <= 15 || h >= 345) && s > 0.35 && v > 0.15) redPixels++;

          // Heurística de anomalía para insectos/plagas
          const brightness = v;
          const greenness = (h >= 70 && h <= 160) ? 1 : 0;
          const score = Math.max(0, brightness * (1 - greenness) * (s < 0.6 ? 1 : 0.6));

          const gx = Math.min(gridW - 1, Math.floor(x / cellW));
          const gy = Math.min(gridH - 1, Math.floor(y / cellH));
          grid[gy * gridW + gx] += score;
        }
      }

      let maxScore = 0;
      for (let i = 0; i < grid.length; i++) if (grid[i] > maxScore) maxScore = grid[i];
      if (maxScore > 0) {
        for (let i = 0; i < grid.length; i++) grid[i] = grid[i] / maxScore;
      }

      self.postMessage({ id, rSum, gSum, bSum, count, plantPixels, redPixels, heatmap: grid.buffer, gridW, gridH }, [grid.buffer]);
      return;
    }

    // ML mode: lazy-load TF + mobilenet and classify a 224x224 resized image
    if (mode === 'ml') {
      try {
        if (!tfLoaded) {
          try {
            importScripts('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.10.0/dist/tf.min.js');
            importScripts('https://cdn.jsdelivr.net/npm/@tensorflow-models/mobilenet@2.1.0/dist/mobilenet.min.js');
            tfLoaded = true;
          } catch (ie) {
            self.postMessage({ id, error: 'No se pudo cargar TF.js en el worker: ' + String(ie) });
            return;
          }
        }
        if (!mobilenetModel) {
          // @ts-ignore
          mobilenetModel = await mobilenet.load({ version: 2, alpha: 1.0 });
        }

        const targetW = 224, targetH = 224;
        let bmp = null;
        try {
          if (typeof OffscreenCanvas !== 'undefined') {
            const oc = new OffscreenCanvas(width, height);
            const ctx = oc.getContext('2d');
            const img = new ImageData(data, width, height);
            ctx.putImageData(img, 0, 0);
            const oc2 = new OffscreenCanvas(targetW, targetH);
            const ctx2 = oc2.getContext('2d');
            ctx2.drawImage(oc, 0, 0, targetW, targetH);
            bmp = ctx2.getImageData(0, 0, targetW, targetH);
          } else {
            const out = new Uint8ClampedArray(targetW * targetH * 4);
            const sx = width / targetW; const sy = height / targetH;
            for (let y = 0; y < targetH; y++) {
              for (let x = 0; x < targetW; x++) {
                const startX = Math.floor(x * sx); const startY = Math.floor(y * sy);
                const endX = Math.min(width, Math.floor((x + 1) * sx));
                const endY = Math.min(height, Math.floor((y + 1) * sy));
                let r=0,g=0,b=0,a=0,countCell=0;
                for (let yy = startY; yy < endY; yy++) {
                  for (let xx = startX; xx < endX; xx++) {
                    const i = (yy * width + xx) * 4;
                    r += data[i]; g += data[i+1]; b += data[i+2]; a += data[i+3]; countCell++;
                  }
                }
                const di = (y * targetW + x) * 4;
                if (countCell) {
                  out[di] = Math.round(r / countCell);
                  out[di+1] = Math.round(g / countCell);
                  out[di+2] = Math.round(b / countCell);
                  out[di+3] = Math.round(a / countCell);
                }
              }
            }
            bmp = new ImageData(out, targetW, targetH);
          }
        } catch (exImg) {
          self.postMessage({ id, error: 'Error preparando imagen para ML: ' + String(exImg) });
          return;
        }

        try {
          const imgTensor = tf.browser.fromPixels(bmp);
          const predictions = await mobilenetModel.classify(imgTensor, 5);
          imgTensor.dispose();
          self.postMessage({ id, ml: true, predictions });
          return;
        } catch (exPred) {
          self.postMessage({ id, error: 'Error clasificando con ML: ' + String(exPred) });
          return;
        }
      } catch (e) {
        self.postMessage({ id, error: 'Error en modo ML: ' + String(e) });
        return;
      }
    }

    // Fallback: previous simple stats
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i] / 255;
      const g = data[i+1] / 255;
      const b = data[i+2] / 255;
      rSum += data[i]; gSum += data[i+1]; bSum += data[i+2]; count++;

      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const delta = max - min;
      let h = 0;
      if (delta !== 0) {
        if (max === r) h = ((g - b) / delta) % 6;
        else if (max === g) h = (b - r) / delta + 2;
        else h = (r - g) / delta + 4;
        h = Math.round(h * 60);
        if (h < 0) h += 360;
      }
      const s = max === 0 ? 0 : delta / max;
      const v = max;

      if (h >= 70 && h <= 160 && s > 0.2 && v > 0.05) plantPixels++;
      if ((h <= 15 || h >= 345) && s > 0.35 && v > 0.15) redPixels++;
    }

    self.postMessage({ id, rSum, gSum, bSum, count, plantPixels, redPixels });
  } catch (err) {
    self.postMessage({ id, error: String(err) });
  }
};
// Worker que procesa ImageData en HSV y devuelve estadísticas resumidas
self.onmessage = function (e) {
  const { id, width, height, buffer, mode, gridW, gridH } = e.data || {};
  try {
    const data = new Uint8ClampedArray(buffer);
    let rSum = 0, gSum = 0, bSum = 0, count = 0;
    let plantPixels = 0, redPixels = 0;

    // If mode is 'heatmap', produce a downsampled grid of anomaly scores
    if (mode === 'heatmap' && gridW && gridH) {
      const grid = new Float32Array(gridW * gridH);
      // initialize
      for (let i = 0; i < grid.length; i++) grid[i] = 0;

      const cellW = Math.max(1, Math.floor(width / gridW));
      const cellH = Math.max(1, Math.floor(height / gridH));

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = (y * width + x) * 4;
          const r = data[idx] / 255;
          const g = data[idx+1] / 255;
          const b = data[idx+2] / 255;
          rSum += data[idx]; gSum += data[idx+1]; bSum += data[idx+2]; count++;

          const max = Math.max(r, g, b);
          const min = Math.min(r, g, b);
          const delta = max - min;
          let h = 0;
          if (delta !== 0) {
            if (max === r) h = ((g - b) / delta) % 6;
            else if (max === g) h = (b - r) / delta + 2;
            else h = (r - g) / delta + 4;
            h = Math.round(h * 60);
            if (h < 0) h += 360;
          }
          const s = max === 0 ? 0 : delta / max;
          const v = max;

          if (h >= 70 && h <= 160 && s > 0.2 && v > 0.05) plantPixels++;
          if ((h <= 15 || h >= 345) && s > 0.35 && v > 0.15) redPixels++;

          // Heurística de anomalía para insectos/plagas:
          // pequeñas zonas brillantes (alto v) con baja saturación or colores fuera del verde podrían indicar insectos o daño.
          const brightness = v;
          const greenness = (h >= 70 && h <= 160) ? 1 : 0;
          // score: brillo alto y poca 'greenness' -> mayor probabilidad de ser insecto/daño
          const score = Math.max(0, brightness * (1 - greenness) * (s < 0.6 ? 1 : 0.6));

          const gx = Math.min(gridW - 1, Math.floor(x / cellW));
          const gy = Math.min(gridH - 1, Math.floor(y / cellH));
          grid[gy * gridW + gx] += score;
        }
      }

      // Normalize grid to 0..1
      let maxScore = 0;
      for (let i = 0; i < grid.length; i++) if (grid[i] > maxScore) maxScore = grid[i];
      if (maxScore > 0) {
        for (let i = 0; i < grid.length; i++) grid[i] = grid[i] / maxScore;
      }

      // Transfer the grid buffer back
      self.postMessage({ id, rSum, gSum, bSum, count, plantPixels, redPixels, heatmap: grid.buffer, gridW, gridH }, [grid.buffer]);
      return;
    }

    // Fallback: previous simple stats
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i] / 255;
      const g = data[i+1] / 255;
      const b = data[i+2] / 255;
      rSum += data[i]; gSum += data[i+1]; bSum += data[i+2]; count++;

      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const delta = max - min;
      let h = 0;
      if (delta !== 0) {
        if (max === r) h = ((g - b) / delta) % 6;
        else if (max === g) h = (b - r) / delta + 2;
        else h = (r - g) / delta + 4;
        h = Math.round(h * 60);
        if (h < 0) h += 360;
      }
      const s = max === 0 ? 0 : delta / max;
      const v = max;

      if (h >= 70 && h <= 160 && s > 0.2 && v > 0.05) plantPixels++;
      if ((h <= 15 || h >= 345) && s > 0.35 && v > 0.15) redPixels++;
    }

    self.postMessage({ id, rSum, gSum, bSum, count, plantPixels, redPixels });
  } catch (err) {
    self.postMessage({ id, error: String(err) });
  }
};
