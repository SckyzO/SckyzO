import { svgFrame, text, cardTitle, tokyonight } from '../lib/theme.mjs';

// items render as colored rounded chips, wrapping to a new row when a chip
// would overflow the card width. Chip width is estimated from label length
// since SVG text isn't measured until render (no canvas/DOM available here).
function chipsCard(emoji, title, items, t) {
  const W = 800, padX = 28, gapX = 8, gapY = 9, chipH = 30, startY = 68;
  let x = padX, y = startY, maxRowsY = startY;
  const out = [];
  for (const it of items) {
    const w = Math.round(22 + it.label.length * 8.6);           // approx text width + padding
    if (x + w > W - padX) { x = padX; y += chipH + gapY; }
    out.push(`<rect x="${x}" y="${y}" width="${w}" height="${chipH}" rx="7" fill="${it.color}"/>`
      + text(x + w / 2, y + 20, it.label, { fill: it.fg || '#ffffff', size: 13, weight: 600, anchor: 'middle' }, t));
    x += w + gapX; maxRowsY = y;
  }
  return svgFrame(W, maxRowsY + chipH + 14, cardTitle(emoji, title, t) + out.join(''), t);
}

export function renderStack(data, t = tokyonight) { return chipsCard('🧪', 'Languages & Stack', data.stack || [], t); }
export function renderTools(data, t = tokyonight) { return chipsCard('🧰', 'Tools & Environment', data.tools || [], t); }
