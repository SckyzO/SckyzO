import { svgFrame, text, tokyonight } from '../lib/theme.mjs';

export function renderTrophies(data, t = tokyonight) {
  const tr = data.trophies;
  const W = 430, cellW = (W - 40) / tr.length, top = 42;
  const inner = [text(20, 30, '🏆 Achievements', { fill: t.title, size: 14, weight: 600 })];
  tr.forEach((c, i) => {
    const x = 20 + cellW * i;
    inner.push(`<rect x="${x + 3}" y="${top}" width="${cellW - 6}" height="46" rx="7" fill="none" stroke="${t.line}"/>`);
    inner.push(text(x + cellW / 2, top + 24, c.rank, { fill: t.gold, size: 15, weight: 700, anchor: 'middle', mono: true }));
    inner.push(text(x + cellW / 2, top + 40, c.kind, { fill: t.dim, size: 9, anchor: 'middle' }));
  });
  return svgFrame(W, top + 58, inner.join(''), t);
}
