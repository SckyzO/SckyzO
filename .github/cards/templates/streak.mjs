import { svgFrame, text, cardTitle, fmtNum, tokyonight } from '../lib/theme.mjs';
export function renderStreak(data, t = tokyonight) {
  const s = data.streak, W = 495, cw = W / 3;
  const cols = [[fmtNum(s.total), 'Total Contributions', t.white], [String(s.current), 'Current Streak', t.flame], [fmtNum(s.longest), 'Longest Streak', t.white]];
  const inner = cardTitle('🔥', 'Contribution Streak', t)
    + cols.map(([big, sub, col], i) => { const cx = cw * i + cw / 2; return text(cx, 122, big, { fill: col, size: 34, weight: 700, anchor: 'middle' }) + text(cx, 150, sub, { fill: t.dim, size: 13, anchor: 'middle' }) + (i > 0 ? `<line x1="${cw * i}" y1="78" x2="${cw * i}" y2="162" stroke="${t.line}"/>` : ''); }).join('');
  return svgFrame(W, 196, inner, t);
}
