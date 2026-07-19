import { svgFrame, text, cardTitle, fmtNum, tokyonight } from '../lib/theme.mjs';
export function renderStats(data, t = tokyonight) {
  const s = data.stats;
  const rows = [['⭐', 'Total Stars Earned', s.stars], ['⬆', 'Total Commits', s.commits], ['⎇', 'Total PRs', s.prs], ['◎', 'Total Issues', s.issues], ['◈', 'Contributed to', s.contributedTo], ['👥', 'Followers', s.followers]];
  const TOP = 84, ROW_H = 24;
  const inner = cardTitle('📊', 'GitHub Stats', t)
    + rows.map(([ic, l, v], i) => { const y = TOP + i * ROW_H; return text(34, y, ic, { fill: t.dim, size: 14 }) + text(58, y, l, { size: 15 }) + text(630, y, fmtNum(v), { fill: t.white, size: 15, weight: 600, anchor: 'end' }); }).join('')
    + `<g transform="translate(710,${TOP + ((rows.length - 1) * ROW_H) / 2 - 5})"><circle r="46" fill="none" stroke="${t.line}" stroke-width="7"/><circle r="46" fill="none" stroke="${t.accent}" stroke-width="7" stroke-linecap="round" stroke-dasharray="289" stroke-dashoffset="40" transform="rotate(-90)"/>${text(0, 9, s.grade, { fill: t.accent, size: 27, weight: 700, anchor: 'middle' })}</g>`;
  return svgFrame(800, TOP + rows.length * ROW_H + 12, inner, t);
}
