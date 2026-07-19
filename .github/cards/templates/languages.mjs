import { svgFrame, text, cardTitle, tokyonight } from '../lib/theme.mjs';

export function renderLanguages(data, t = tokyonight) {
  const langs = data.languages;
  const W = 495, padX = 28, barY = 88, barH = 14, barW = W - padX * 2;
  let x = padX;
  const bar = langs.map((l) => {
    const w = (l.pct / 100) * barW;
    const seg = `<rect x="${x.toFixed(1)}" y="${barY}" width="${w.toFixed(1)}" height="${barH}" fill="${l.color}"/>`;
    x += w;
    return seg;
  }).join('');
  const legendTop = barY + barH + 32, rowH = 30, colW = barW / 2;
  const legend = langs.map((l, i) => {
    const lx = padX + (i % 2) * colW;
    const ly = legendTop + Math.floor(i / 2) * rowH;
    return `<circle cx="${lx + 6}" cy="${ly - 5}" r="6" fill="${l.color}"/>`
      + text(lx + 20, ly, `${l.name} ${l.pct}%`, { fill: t.ink, size: 15 });
  }).join('');
  const inner = cardTitle('💬', 'Most Used Languages', t)
    + `<clipPath id="lb"><rect x="${padX}" y="${barY}" width="${barW}" height="${barH}" rx="6"/></clipPath>`
    + `<g clip-path="url(#lb)">${bar}</g>` + legend;
  const rows = Math.ceil(langs.length / 2);
  return svgFrame(W, legendTop + (rows - 1) * rowH + 26, inner, t);
}
