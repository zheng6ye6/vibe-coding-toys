/**
 * 八极星芒图：E / I / S / N / T / F / J / P 各维度权重（由二十题得分换算）
 */
const YSTIRadar = (function () {
  const AXES = [
    { key: "E", dim: "EI", pole: 1, label: "外向 E" },
    { key: "I", dim: "EI", pole: -1, label: "内向 I" },
    { key: "S", dim: "SN", pole: 1, label: "实感 S" },
    { key: "N", dim: "SN", pole: -1, label: "直觉 N" },
    { key: "T", dim: "TF", pole: 1, label: "思考 T" },
    { key: "F", dim: "TF", pole: -1, label: "情感 F" },
    { key: "J", dim: "JP", pole: 1, label: "判断 J" },
    { key: "P", dim: "JP", pole: -1, label: "知觉 P" },
  ];

  const MAX_PER_DIM = 10;

  function computeRawSums(answers) {
    const sum = { EI: 0, SN: 0, TF: 0, JP: 0 };
    QUESTIONS.forEach((q, qi) => {
      const optIdx = answers[qi];
      if (optIdx == null) return;
      const opt = q.options[optIdx];
      DIMENSIONS.forEach((dim) => {
        if (opt.scores[dim] != null) sum[dim] += opt.scores[dim];
      });
    });
    return sum;
  }

  function computeWeights(answers) {
    const sum = computeRawSums(answers);
    const weights = {};

    AXES.forEach((axis) => {
      const raw = sum[axis.dim];
      const poleScore = axis.pole * raw;
      const pct = Math.round(((poleScore + MAX_PER_DIM) / (2 * MAX_PER_DIM)) * 100);
      weights[axis.key] = Math.max(8, Math.min(92, pct));
    });

    return { weights, raw: sum };
  }

  function draw(canvas, weights, accentColor) {
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    const size = canvas.clientWidth || 280;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const cx = size / 2;
    const cy = size / 2;
    const maxR = size * 0.38;
    const n = AXES.length;
    const color = accentColor || "#d4a853";

    ctx.clearRect(0, 0, size, size);

    for (let ring = 1; ring <= 4; ring++) {
      ctx.beginPath();
      const r = (maxR * ring) / 4;
      for (let i = 0; i <= n; i++) {
        const a = (Math.PI * 2 * i) / n - Math.PI / 2;
        const x = cx + Math.cos(a) * r;
        const y = cy + Math.sin(a) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.strokeStyle = `rgba(255,255,255,${0.06 + ring * 0.02})`;
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    for (let i = 0; i < n; i++) {
      const a = (Math.PI * 2 * i) / n - Math.PI / 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(a) * maxR, cy + Math.sin(a) * maxR);
      ctx.strokeStyle = "rgba(255,255,255,0.1)";
      ctx.stroke();
    }

    ctx.beginPath();
    AXES.forEach((axis, i) => {
      const pct = weights[axis.key] / 100;
      const a = (Math.PI * 2 * i) / n - Math.PI / 2;
      const r = maxR * pct;
      const x = cx + Math.cos(a) * r;
      const y = cy + Math.sin(a) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fillStyle = hexToRgba(color, 0.32);
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();

    AXES.forEach((axis, i) => {
      const pct = weights[axis.key] / 100;
      const a = (Math.PI * 2 * i) / n - Math.PI / 2;
      const r = maxR * pct;
      const x = cx + Math.cos(a) * r;
      const y = cy + Math.sin(a) * r;
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();

      const lx = cx + Math.cos(a) * (maxR + 22);
      const ly = cy + Math.sin(a) * (maxR + 22);
      ctx.font = "11px sans-serif";
      ctx.fillStyle = "#9aa3b8";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`${axis.key} ${weights[axis.key]}%`, lx, ly);
    });

    ctx.font = "600 13px sans-serif";
    ctx.fillStyle = color;
    ctx.textAlign = "center";
    ctx.fillText("性格星芒 · 维度权重", cx, size - 12);
  }

  function hexToRgba(hex, a) {
    if (!hex || hex[0] !== "#") return `rgba(212,168,83,${a})`;
    const h = hex.slice(1);
    const n = parseInt(h.length === 3 ? h.replace(/./g, "$&$&") : h, 16);
    const r = (n >> 16) & 255;
    const g = (n >> 8) & 255;
    const b = n & 255;
    return `rgba(${r},${g},${b},${a})`;
  }

  function renderLegend(container, weights) {
    container.innerHTML = AXES.map(
      (a) =>
        `<span class="radar-legend-item"><b>${a.key}</b> ${weights[a.key]}%</span>`
    ).join("");
  }

  return { computeWeights, draw, renderLegend, AXES };
})();
