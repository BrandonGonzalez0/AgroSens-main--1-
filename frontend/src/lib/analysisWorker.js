// Worker que procesa ImageData en HSV y devuelve estadísticas resumidas
self.onmessage = function (e) {
  const { id, width, height, buffer } = e.data || {};
  try {
    const data = new Uint8ClampedArray(buffer);
    let rSum = 0, gSum = 0, bSum = 0, count = 0;
    let plantPixels = 0, redPixels = 0;

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

      // máscara de planta/hojas: tono verde (h entre 70 y 160), saturación suficiente y valor
      if (h >= 70 && h <= 160 && s > 0.2 && v > 0.05) plantPixels++;
      // máscara de fruta roja (tomate): tono cercano a 0 o >345
      if ((h <= 15 || h >= 345) && s > 0.35 && v > 0.15) redPixels++;
    }

    self.postMessage({ id, rSum, gSum, bSum, count, plantPixels, redPixels });
  } catch (err) {
    self.postMessage({ id, error: String(err) });
  }
};
