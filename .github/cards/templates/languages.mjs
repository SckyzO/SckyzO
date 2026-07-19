import { svgFrame, text, cardTitle, tokyonight } from '../lib/theme.mjs';

export function renderLanguages(data, t = tokyonight) {
  const langs = data.languages;
  const W = 800, x0 = 34, x1 = 766, barY = 88, barH = 14, barW = x1 - x0;
  let x = x0;
  const bar = langs.map((l) => {
    const w = (l.pct / 100) * barW;
    const seg = `<rect x="${x.toFixed(1)}" y="${barY}" width="${w.toFixed(1)}" height="${barH}" fill="${l.color}"/>`;
    x += w;
    return seg;
  }).join('');
  const legendTop = barY + barH + 32, rowH = 30, colW = barW / 2;
  const legend = langs.map((l, i) => {
    const lx = x0 + (i % 2) * colW;
    const ly = legendTop + Math.floor(i / 2) * rowH;
    return `<circle cx="${lx + 6}" cy="${ly - 5}" r="6" fill="${l.color}"/>`
      + text(lx + 20, ly, `${l.name} ${l.pct}%`, { fill: t.ink, size: 15 }, t);
  }).join('');
  const inner = cardTitle('💬', 'Most Used Languages', t)
    + `<clipPath id="lb"><rect x="${x0}" y="${barY}" width="${barW}" height="${barH}" rx="6"/></clipPath>`
    + `<g clip-path="url(#lb)">${bar}</g>` + legend;
  const rows = Math.ceil(langs.length / 2);
  return svgFrame(W, legendTop + (rows - 1) * rowH + 26, inner, t);
}
