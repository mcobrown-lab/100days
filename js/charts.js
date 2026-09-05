// Minimal dependency-free canvas charts.
const Charts = (() => {

  function prepareCanvas(canvas) {
    const dpr = window.devicePixelRatio || 1;
    const cssWidth = canvas.clientWidth || canvas.parentElement.clientWidth;
    const cssHeight = canvas.clientHeight || 200;
    canvas.width = Math.max(1, Math.round(cssWidth * dpr));
    canvas.height = Math.max(1, Math.round(cssHeight * dpr));
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssWidth, cssHeight);
    return { ctx, w: cssWidth, h: cssHeight };
  }

  const COLORS = {
    grid: '#2c3345',
    text: '#9aa3b6',
    accent: '#38bd98',
    target: '#e5686b'
  };

  // points: [{x:number, y:number}], xMax: number
  function drawLineChart(canvas, points, xMax, yLabel) {
    const { ctx, w, h } = prepareCanvas(canvas);
    const padL = 34, padR = 10, padT = 12, padB = 22;
    const plotW = w - padL - padR;
    const plotH = h - padT - padB;

    if (points.length === 0) return;

    const ys = points.map(p => p.y);
    let yMin = Math.min(...ys), yMax = Math.max(...ys);
    if (yMin === yMax) { yMin -= 1; yMax += 1; }
    const pad = (yMax - yMin) * 0.1;
    yMin -= pad; yMax += pad;

    const xScale = x => padL + (x / xMax) * plotW;
    const yScale = y => padT + plotH - ((y - yMin) / (yMax - yMin)) * plotH;

    // grid lines (y)
    ctx.strokeStyle = COLORS.grid;
    ctx.fillStyle = COLORS.text;
    ctx.font = '11px sans-serif';
    ctx.lineWidth = 1;
    const ySteps = 4;
    for (let i = 0; i <= ySteps; i++) {
      const val = yMin + (i / ySteps) * (yMax - yMin);
      const yPix = yScale(val);
      ctx.beginPath();
      ctx.moveTo(padL, yPix);
      ctx.lineTo(w - padR, yPix);
      ctx.stroke();
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(val.toFixed(1), padL - 6, yPix);
    }

    // x axis labels
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    const xSteps = Math.min(5, xMax);
    for (let i = 0; i <= xSteps; i++) {
      const val = Math.round((i / xSteps) * xMax);
      ctx.fillText('D' + val, xScale(val), h - padB + 6);
    }

    // line
    ctx.strokeStyle = COLORS.accent;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    points.forEach((p, i) => {
      const px = xScale(p.x), py = yScale(p.y);
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    });
    ctx.stroke();

    // dots
    ctx.fillStyle = COLORS.accent;
    points.forEach(p => {
      ctx.beginPath();
      ctx.arc(xScale(p.x), yScale(p.y), 3, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  // bars: [{label:string, value:number}], target: number|0
  function drawBarChart(canvas, bars, target) {
    const { ctx, w, h } = prepareCanvas(canvas);
    const padL = 34, padR = 10, padT = 12, padB = 22;
    const plotW = w - padL - padR;
    const plotH = h - padT - padB;

    if (bars.length === 0) return;

    const maxVal = Math.max(target || 0, ...bars.map(b => b.value), 1);
    const yScale = v => padT + plotH - (v / maxVal) * plotH;

    ctx.strokeStyle = COLORS.grid;
    ctx.fillStyle = COLORS.text;
    ctx.font = '11px sans-serif';
    ctx.lineWidth = 1;
    const ySteps = 4;
    for (let i = 0; i <= ySteps; i++) {
      const val = (i / ySteps) * maxVal;
      const yPix = yScale(val);
      ctx.beginPath();
      ctx.moveTo(padL, yPix);
      ctx.lineTo(w - padR, yPix);
      ctx.stroke();
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(Math.round(val), padL - 6, yPix);
    }

    const slot = plotW / bars.length;
    const barW = Math.min(28, slot * 0.55);

    // Only draw as many x-axis labels as fit without overlapping.
    ctx.font = '11px sans-serif';
    const widestLabel = Math.max(...bars.map(b => ctx.measureText(b.label).width));
    const labelStep = Math.max(1, Math.ceil((widestLabel + 6) / slot));

    bars.forEach((b, i) => {
      const cx = padL + slot * (i + 0.5);
      const barTop = yScale(b.value);
      const hit = target > 0 && b.value >= target;
      ctx.fillStyle = hit ? COLORS.accent : '#4a5a72';
      ctx.fillRect(cx - barW / 2, barTop, barW, (padT + plotH) - barTop);

      if (i % labelStep === 0) {
        ctx.fillStyle = COLORS.text;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(b.label, cx, h - padB + 6);
      }
    });

    if (target > 0) {
      const ty = yScale(target);
      ctx.strokeStyle = COLORS.target;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(padL, ty);
      ctx.lineTo(w - padR, ty);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  return { drawLineChart, drawBarChart };
})();
