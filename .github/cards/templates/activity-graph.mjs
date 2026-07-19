import { svgFrame, text, cardTitle, tokyonight } from '../lib/theme.mjs';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Parsed manually (no Date) to avoid timezone-shift surprises on "YYYY-MM-DD" strings.
function fmtDate(iso) {
  const [, m, d] = iso.split('-');
  return `${MONTHS[Number(m) - 1]} ${Number(d)}`;
}

export function renderActivityGraph(data, t = tokyonight) {
  // The window size (`activityGraph.days` config) is decided upstream by the
  // data layer (`fetchAll` / `lib/github.mjs`), not here — re-slicing would
  // silently cap a user's configured window back down to 30.
  const days = data.activityGraph || [];
  const W = 800, x0 = 34, x1 = 766, y0 = 82, y1 = 178;
  const n = Math.max(1, days.length);
  const max = Math.max(1, ...days.map((d) => d.count));
  const px = (i) => x0 + (i / Math.max(1, n - 1)) * (x1 - x0);
  const py = (c) => y1 - (c / max) * (y1 - y0);
  const line = days.map((d, i) => `${px(i).toFixed(1)},${py(d.count).toFixed(1)}`).join(' ');
  const area = `${x0},${y1} ${line} ${x1},${y1}`;
  const grid = [0, 0.5, 1].map((f) => { const gy = y1 - f * (y1 - y0); return `<line x1="${x0}" y1="${gy}" x2="${x1}" y2="${gy}" stroke="${t.line}"/>`; }).join('');

  // Y axis: value labels at the 3 gridlines, just left of the plot.
  const yAxis = [0, 0.5, 1].map((f) => {
    const gy = y1 - f * (y1 - y0);
    const val = f === 0 ? 0 : f === 1 ? max : Math.round(max / 2);
    return text(28, gy + 4, String(val), { fill: t.dim, size: 11, anchor: 'end' }, t);
  }).join('');

  // X axis: a tick every 7 days plus the last day, labeled "Mon D". When the
  // last day lands within a label-width of the final 7-day tick, swap it in
  // rather than adding a neighbor — two centered labels that close overlap.
  const tickIdx = [];
  for (let i = 0; i < n; i += 7) tickIdx.push(i);
  const lastRegular = tickIdx[tickIdx.length - 1];
  if (lastRegular !== n - 1) {
    if (px(n - 1) - px(lastRegular) < 40) tickIdx[tickIdx.length - 1] = n - 1;
    else tickIdx.push(n - 1);
  }
  const xAxis = tickIdx.map((i) => {
    const x = px(i).toFixed(1);
    return `<line x1="${x}" y1="${y1}" x2="${x}" y2="${y1 + 5}" stroke="${t.dim}"/>`
      + text(px(i), 194, fmtDate(days[i].date), { fill: t.dim, size: 11, anchor: 'middle' }, t);
  }).join('');

  const total = days.reduce((s, d) => s + d.count, 0);
  const avg = (total / n).toFixed(1);
  const inner = cardTitle('📈', `Activity · last ${days.length} days`, t)
    + `<defs><linearGradient id="ag" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="${t.title}" stop-opacity="0.35"/><stop offset="1" stop-color="${t.title}" stop-opacity="0"/></linearGradient></defs>`
    + grid
    + `<polygon points="${area}" fill="url(#ag)"/>`
    + `<polyline points="${line}" fill="none" stroke="${t.title}" stroke-width="2" stroke-linejoin="round"/>`
    + yAxis
    + xAxis
    + text(x0, 216, `${total} contributions`, { fill: t.dim, size: 12 }, t)
    + text(x1, 216, `avg ${avg}/day · peak ${max}`, { fill: t.dim, size: 12, anchor: 'end' }, t);
  return svgFrame(W, 232, inner, t);
}
