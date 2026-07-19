import { svgFrame, text, cardTitle, tokyonight } from '../lib/theme.mjs';
export function renderAbout(data, t = tokyonight) {
  const lines = data.about || [];
  const inner = cardTitle('👤', 'About Me', t)
    + lines.map((l, i) => text(34, 86 + i * 27, l, { size: 14 })).join('');
  return svgFrame(495, 74 + lines.length * 27, inner, t);
}
