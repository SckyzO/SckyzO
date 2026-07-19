import { svgFrame, text, tokyonight } from '../lib/theme.mjs';

export function renderLanguages(data, t = tokyonight) {
  const langs = data.languages;
  const W = 430, barX = 20, barW = W - 40, barY = 48;
  let x = barX;
  const bar = langs.map((l) => {
    const w = (l.pct / 100) * barW;
    const seg = `<rect x="${x.toFixed(1)}" y="${barY}" width="${w.toFixed(1)}" height="9" fill="${l.color}"/>`;
    x += w;
    return seg;
  }).join('');
  const legend = langs.map((l, i) => {
    const lx = barX + (i % 2) * (barW / 2);
    const ly = 78 + Math.floor(i / 2) * 20;
    return `<circle cx="${lx + 5}" cy="${ly - 4}" r="5" fill="${l.color}"/>`
      + text(lx + 16, ly, `${l.name} ${l.pct}%`, { fill: t.ink, size: 12 });
  }).join('');
  const inner = text(20, 30, 'Most Used Languages', { fill: t.title, size: 14, weight: 600 })
    + `<clipPath id="lb"><rect x="${barX}" y="${barY}" width="${barW}" height="9" rx="4"/></clipPath>`
    + `<g clip-path="url(#lb)">${bar}</g>` + legend;
  return svgFrame(W, 78 + Math.ceil(langs.length / 2) * 20 + 8, inner, t);
}
