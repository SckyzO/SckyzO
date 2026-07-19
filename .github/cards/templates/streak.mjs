import { svgFrame, text, tokyonight, fmtNum } from '../lib/theme.mjs';

export function renderStreak(data, t = tokyonight) {
  const s = data.streak;
  const cols = [
    { big: fmtNum(s.total), sub: 'Total Contributions', color: t.white },
    { big: String(s.current), sub: 'Current Streak', color: t.flame },
    { big: fmtNum(s.longest), sub: 'Longest Streak', color: t.white },
  ];
  const W = 430, colW = W / 3;
  const inner = cols.flatMap((c, i) => {
    const cx = colW * i + colW / 2;
    const parts = [
      text(cx, 54, c.big, { fill: c.color, size: 24, weight: 700, anchor: 'middle', mono: true }),
      text(cx, 78, c.sub, { fill: t.dim, size: 11, anchor: 'middle' }),
    ];
    if (i > 0) parts.push(`<line x1="${colW * i}" y1="24" x2="${colW * i}" y2="86" stroke="${t.line}"/>`);
    return parts;
  }).join('');
  return svgFrame(W, 110, inner, t);
}
