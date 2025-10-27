// analysisWorker.js
// Worker que procesa ImageData y soporta tres modos:
// - default: estadísticas y bounding box de píxeles verdes
// - heatmap: produce una cuadrícula normalizada de puntajes de anomalía
// - ml: carga TF.js y un modelo custom (opcional) o mobilenet para clasificar

let tfLoaded = false;
let mobilenetModel = null;
let customModel = null;

const loadTfAndMobilenet = async () => {
  if (tfLoaded) return;
  try {
    // notify main thread that loading starts
    try { self.postMessage({ status: 'model-loading' }); } catch (e) {}
    importScripts('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.10.0/dist/tf.min.js');
    importScripts('https://cdn.jsdelivr.net/npm/@tensorflow-models/mobilenet@2.1.0/dist/mobilenet.min.js');
    tfLoaded = true;
    try { self.postMessage({ status: 'model-loaded', model: 'mobilenet' }); } catch (e) {}
  } catch (e) {
    try { self.postMessage({ status: 'model-error', error: String(e) }); } catch (ee) {}
    throw new Error('No se pudo cargar TF.js en el worker: ' + String(e));
  }
};

const isGreenHSV = (r, g, b) => {
  // r,g,b in 0..1
  const max = Math.max(r, g, b), min = Math.min(r, g, b), delta = max - min;
  if (delta === 0) return false;
  let h = 0;
  if (max === r) h = ((g - b) / delta) % 6;
  else if (max === g) h = (b - r) / delta + 2;
  else h = (r - g) / delta + 4;
  h = Math.round(h * 60);
  if (h < 0) h += 360;
  const s = max === 0 ? 0 : delta / max;
  const v = max;
  return (h >= 70 && h <= 160 && s > 0.15 && v > 0.05);
};

self.onmessage = async function (e) {
  const { id, width, height, buffer, mode, gridW, gridH, customModelUrl, customLabels } = e.data || {};
  try {
    const data = new Uint8ClampedArray(buffer);
    let rSum = 0, gSum = 0, bSum = 0, count = 0;
    let plantPixels = 0, redPixels = 0;
    let minX = width, minY = height, maxX = 0, maxY = 0;

    // Pre-scan to compute simple stats and green bounding box
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const r = data[idx] / 255, g = data[idx+1] / 255, b = data[idx+2] / 255;
        rSum += data[idx]; gSum += data[idx+1]; bSum += data[idx+2]; count++;
        const max = Math.max(r, g, b), min = Math.min(r, g, b), delta = max - min;
        let h = 0;
        if (delta !== 0) {
          if (max === r) h = ((g - b) / delta) % 6;
          else if (max === g) h = (b - r) / delta + 2;
          else h = (r - g) / delta + 4;
          h = Math.round(h * 60); if (h < 0) h += 360;
        }
        const s = max === 0 ? 0 : delta / max; const v = max;
        if (h >= 70 && h <= 160 && s > 0.2 && v > 0.05) {
          plantPixels++;
          if (x < minX) minX = x; if (y < minY) minY = y; if (x > maxX) maxX = x; if (y > maxY) maxY = y;
        }
        if ((h <= 15 || h >= 345) && s > 0.35 && v > 0.15) redPixels++;
      }
    }

    const bboxArea = (maxX >= minX && maxY >= minY) ? ((maxX - minX + 1) * (maxY - minY + 1)) : 0;
    const areaRatio = (width * height) ? (bboxArea / (width * height)) : 0;

    // Heatmap mode: downsample into gridW x gridH with anomaly scores
    if (mode === 'heatmap' && gridW && gridH) {
      const grid = new Float32Array(gridW * gridH);
      for (let i = 0; i < grid.length; i++) grid[i] = 0;
      const cellW = Math.max(1, Math.floor(width / gridW));
      const cellH = Math.max(1, Math.floor(height / gridH));

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = (y * width + x) * 4;
          const r = data[idx] / 255, g = data[idx+1] / 255, b = data[idx+2] / 255;
          const max = Math.max(r, g, b), min = Math.min(r, g, b), delta = max - min;
          let h = 0; if (delta !== 0) {
            if (max === r) h = ((g - b) / delta) % 6;
            else if (max === g) h = (b - r) / delta + 2;
            else h = (r - g) / delta + 4;
            h = Math.round(h * 60); if (h < 0) h += 360;
          }
          const s = max === 0 ? 0 : delta / max; const v = max;
          // score: brillo alto y poca 'greenness' -> mayor probabilidad de ser insecto/daño
          const greenness = (h >= 70 && h <= 160) ? 1 : 0;
          const score = Math.max(0, v * (1 - greenness) * (s < 0.6 ? 1 : 0.6));
          const gx = Math.min(gridW - 1, Math.floor(x / cellW));
          const gy = Math.min(gridH - 1, Math.floor(y / cellH));
          grid[gy * gridW + gx] += score;
        }
      }
      // Normalize
      let maxScore = 0; for (let i = 0; i < grid.length; i++) if (grid[i] > maxScore) maxScore = grid[i];
      if (maxScore > 0) for (let i = 0; i < grid.length; i++) grid[i] = grid[i] / maxScore;

      self.postMessage({ id, rSum, gSum, bSum, count, plantPixels, redPixels, heatmap: grid.buffer, gridW, gridH, bboxArea, areaRatio }, [grid.buffer]);
      return;
    }

    // ML mode: try to load TF + custom model (if provided) or fallback to mobilenet
    if (mode === 'ml') {
      try {
        await loadTfAndMobilenet();
        if (!mobilenetModel) {
          // @ts-ignore
          mobilenetModel = await mobilenet.load({ version: 2, alpha: 1.0 });
        }

        // Load custom model if requested
        if (customModelUrl && !customModel) {
          try {
            try { self.postMessage({ id, status: 'custom-loading', url: customModelUrl }); } catch (e) {}
            // tf must be available globally after loadTfAndMobilenet
            customModel = await tf.loadLayersModel(customModelUrl);
            try { self.postMessage({ id, status: 'custom-loaded', url: customModelUrl }); } catch (e) {}
          } catch (cmErr) {
            // keep customModel null and continue with mobilenet
            try { self.postMessage({ id, status: 'custom-error', error: String(cmErr) }); } catch (e) {}
            self.postMessage({ id, warning: 'No se pudo cargar customModel: ' + String(cmErr) });
          }
        }

        const targetW = 224, targetH = 224;
        // create resized ImageData (bmp)
        let bmp = null;
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

        // estimate green bbox/ratio on resized bmp for size estimation
        let gCountResized = 0, minXR = targetW, minYR = targetH, maxXR = 0, maxYR = 0;
        for (let y = 0; y < targetH; y++) {
          for (let x = 0; x < targetW; x++) {
            const idx = (y * targetW + x) * 4;
            const rr = bmp.data[idx] / 255, gg = bmp.data[idx+1] / 255, bb = bmp.data[idx+2] / 255;
            if (isGreenHSV(rr, gg, bb)) { gCountResized++; if (x < minXR) minXR = x; if (y < minYR) minYR = y; if (x > maxXR) maxXR = x; if (y > maxYR) maxYR = y; }
          }
        }
        const bboxAreaRes = (maxXR >= minXR && maxYR >= minYR) ? ((maxXR - minXR + 1) * (maxYR - minYR + 1)) : 0;
        const areaRatioRes = (targetW * targetH) ? (bboxAreaRes / (targetW * targetH)) : 0;

        // If we have a customModel; run predict, otherwise use mobilenet
        if (customModel) {
          try {
            const input = tf.browser.fromPixels(bmp).toFloat().div(255).expandDims(0);
            const out = customModel.predict(input);
            // try to get probabilities array
            let probs = null;
            if (Array.isArray(out)) {
              probs = out[0].dataSync();
            } else {
              probs = out.dataSync();
            }
            input.dispose();
            // find top
            let topIdx = 0, topVal = probs[0];
            for (let i = 1; i < probs.length; i++) if (probs[i] > topVal) { topVal = probs[i]; topIdx = i; }
            const label = (customLabels && customLabels[topIdx]) ? customLabels[topIdx] : String(topIdx);
            const predictions = [{ className: label, probability: topVal }];
            self.postMessage({ id, ml: true, predictions, bboxArea: bboxAreaRes, areaRatio: areaRatioRes });
            return;
          } catch (cmErr) {
            self.postMessage({ id, warning: 'Error al usar customModel: ' + String(cmErr) });
            // fallthrough to mobilenet
          }
        }

        // fallback: mobilenet classify
        try {
          const imgTensor = tf.browser.fromPixels(bmp);
          const predictions = await mobilenetModel.classify(imgTensor, 5);
          imgTensor.dispose();
          self.postMessage({ id, ml: true, predictions, bboxArea: bboxAreaRes, areaRatio: areaRatioRes });
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

    // Default fallback: return stats + bbox area ratio
    self.postMessage({ id, rSum, gSum, bSum, count, plantPixels, redPixels, bboxArea, areaRatio });
  } catch (err) {
    self.postMessage({ id, error: String(err) });
  }
};
