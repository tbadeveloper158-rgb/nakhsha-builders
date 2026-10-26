/* Cream/beige contour field and warm chequer dissolve adapted from the supplied KIMI / GRIDO1 reference.
   Helpers own no animation loop; the caller uses its shared, in-view ticker. */
(() => {
  'use strict';
  const LINE_SCALE = 3.8;
  const LINE_COUNT = 2.5;
  const WAVE_AMOUNT = 0.37;
  const WAVE_SPEED = 1.66;
  const LINE_OPACITY = 0.85;
  const CELLS = 96;
  const clamp = n => Math.max(0, Math.min(1, n));
  const field = (x, y, t) => {
    let f = Math.sin(x * 1.0 + t * 0.6) * 0.5;
    f += Math.sin(y * 0.85 - t * 0.45) * 0.45;
    f += Math.sin((x + y) * 0.65 + t * 0.35) * 0.35;
    f += Math.sin((x - y) * 0.95 - t * 0.55) * 0.25;
    return f * 0.5 + 0.5;
  };

  window.createContourField = (canvas, options = {}) => {
    const context = canvas.getContext('2d', { alpha: true });
    let width = 0, height = 0, ratio = 1, cols = 0, rows = 0, values;
    const start = performance.now();
    const colour = options.colour || '#D4C4AF';
    const opacity = options.opacity ?? (options.dark ? 0.62 : 0.72);
    function resize() {
      const rect = canvas.getBoundingClientRect();
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      context?.setTransform(ratio, 0, 0, ratio, 0, 0);
      cols = width >= height ? CELLS : Math.max(8, Math.round((CELLS * width) / height));
      rows = Math.max(8, Math.round((cols * height) / width));
      values = new Float32Array((cols + 1) * (rows + 1));
    }
    function draw(now) {
      if (!context) return;
      if (!values) resize();
      context.clearRect(0, 0, width, height);
      const t = (now - start) / 1000 * WAVE_SPEED;
      const stepX = width / cols, stepY = height / rows, aspect = width / height;
      for (let j = 0; j <= rows; j += 1) for (let i = 0; i <= cols; i += 1) {
        const nx = ((i / cols) * 2 - 1) * aspect * LINE_SCALE;
        const ny = ((j / rows) * 2 - 1) * LINE_SCALE;
        const qx = nx + Math.sin(ny * 0.8 + t * 0.7) * WAVE_AMOUNT;
        const qy = ny + Math.cos(nx * 0.7 - t * 0.6) * WAVE_AMOUNT;
        values[j * (cols + 1) + i] = field(qx, qy, t) * LINE_COUNT;
      }
      context.strokeStyle = colour;
      context.lineWidth = 1;
      context.globalAlpha = opacity * LINE_OPACITY;
      context.beginPath();
      for (let level = 0.5; level < LINE_COUNT; level += 1) {
        for (let j = 0; j < rows; j += 1) for (let i = 0; i < cols; i += 1) {
          const a = values[j * (cols + 1) + i], b = values[j * (cols + 1) + i + 1];
          const c = values[(j + 1) * (cols + 1) + i + 1], d = values[(j + 1) * (cols + 1) + i];
          const index = (a > level ? 8 : 0) | (b > level ? 4 : 0) | (c > level ? 2 : 0) | (d > level ? 1 : 0);
          if (index === 0 || index === 15) continue;
          const x0 = i * stepX, y0 = j * stepY;
          const top = [x0 + stepX * ((level - a) / (b - a)), y0];
          const right = [x0 + stepX, y0 + stepY * ((level - b) / (c - b))];
          const bottom = [x0 + stepX * ((level - d) / (c - d)), y0 + stepY];
          const left = [x0, y0 + stepY * ((level - a) / (d - a))];
          const segment = (p, q) => { context.moveTo(p[0], p[1]); context.lineTo(q[0], q[1]); };
          switch (index) {
            case 1: case 14: segment(left, bottom); break;
            case 2: case 13: segment(bottom, right); break;
            case 3: case 12: segment(left, right); break;
            case 4: case 11: segment(top, right); break;
            case 6: case 9: segment(top, bottom); break;
            case 7: case 8: segment(left, top); break;
            case 5: segment(left, top); segment(bottom, right); break;
            case 10: segment(left, bottom); segment(top, right); break;
          }
        }
      }
      context.stroke();
      context.globalAlpha = 1;
    }
    resize();
    return { resize, draw };
  };

  const dissolveStates = new WeakMap();
  const noise = (x, y) => {
    let h = Math.imul(x, 374761393) + Math.imul(y, 668265263);
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
  };
  window.drawDissolve = (canvas, progress = 0) => {
    let state = dissolveStates.get(canvas);
    if (!state) {
      state = { context: canvas.getContext('2d', { alpha: true }), width: 0, height: 0, ratio: 0 };
      dissolveStates.set(canvas, state);
    }
    if (!state.context) return;
    const rect = canvas.getBoundingClientRect();
    const width = rect.width, height = rect.height;
    if (!width || !height) return;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    if (state.width !== width || state.height !== height || state.ratio !== ratio) {
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      state.context.setTransform(ratio, 0, 0, ratio, 0, 0);
      Object.assign(state, { width, height, ratio });
    }
    const context = state.context;
    context.clearRect(0, 0, width, height);
    const css = getComputedStyle(canvas);
    const cell = Math.max(4, parseFloat(css.getPropertyValue('--flag-cell')) || 24);
    const surface = css.getPropertyValue('--flag-surface').trim() || (canvas.dataset.carry === 'dark' ? '#EFE7DE' : '#F5F1EA');
    const accent = css.getPropertyValue('--accent').trim() || css.getPropertyValue('--bronze').trim() || '#9A764E';
    const columns = Math.ceil(width / cell), rows = Math.ceil(height / cell), lift = clamp(progress) * 2;
    for (let y = 0; y < rows; y += 1) {
      const depth = y / Math.max(1, rows - 1) + lift;
      if (depth > 1) break;
      const solid = depth <= 0.16;
      const fade = clamp(1 - (depth - 0.16) / (1 - 0.16));
      if (!solid && fade <= 0) break;
      for (let x = 0; x < columns; x += 1) {
        if (!solid) {
          if ((x + y) % 2 !== 0) continue;
          if (noise(x, y) > fade) continue;
        }
        context.fillStyle = !solid && noise(x + 101, y + 57) < 0.06 ? accent : surface;
        context.fillRect(x * cell, y * cell, cell, cell);
      }
    }
  };
})();
