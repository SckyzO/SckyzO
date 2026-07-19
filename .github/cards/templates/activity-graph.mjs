import { svgFrame, text, cardTitle, tokyonight } from '../lib/theme.mjs';
export function renderActivityGraph(data, t = tokyonight) {
  const days = (data.activityGraph || []).slice(-30);
  const W = 495, x0 = 30, x1 = 465, y0 = 82, y1 = 178;
  const n = Math.max(1, days.length);
  const max = Math.max(1, ...days.map((d) => d.count));
  const px = (i) => x0 + (i / Math.max(1, n - 1)) * (x1 - x0);
  const py = (c) => y1 - (c / max) * (y1 - y0);
  const line = days.map((d, i) => `${px(i).toFixed(1)},${py(d.count).toFixed(1)}`).join(' ');
  const area = `${x0},${y1} ${line} ${x1},${y1}`;
  const grid = [0, 0.5, 1].map((f) => { const gy = y1 - f * (y1 - y0); return `<line x1="${x0}" y1="${gy}" x2="${x1}" y2="${gy}" stroke="${t.line}"/>`; }).join('');
  const total = days.reduce((s, d) => s + d.count, 0);
  const avg = (total / n).toFixed(1);
  const inner = cardTitle('📈', 'Activity · last 30 days', t)
    + `<defs><linearGradient id="ag" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="${t.title}" stop-opacity="0.35"/><stop offset="1" stop-color="${t.title}" stop-opacity="0"/></linearGradient></defs>`
    + grid
    + `<polygon points="${area}" fill="url(#ag)"/>`
    + `<polyline points="${line}" fill="none" stroke="${t.title}" stroke-width="2" stroke-linejoin="round"/>`
    + text(30, 200, `${total} contributions`, { fill: t.dim, size: 12 })
    + text(465, 200, `avg ${avg}/day · peak ${max}`, { fill: t.dim, size: 12, anchor: 'end' });
  return svgFrame(W, 214, inner, t);
}
