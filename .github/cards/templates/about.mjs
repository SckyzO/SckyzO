import { svgFrame, cardTitle, escapeXml, tokyonight } from '../lib/theme.mjs';

const PAD_X = 34, TOP = 86, ROW_H = 30, SIZE = 15;

// Single <text> with tspans so the bold label and its trailing ": " + body
// flow inline without needing to pre-measure the label's rendered width.
function aboutLine(y, { icon, label, text: body }, t) {
  return `<text x="${PAD_X}" y="${y}" font-size="${SIZE}">`
    + `<tspan fill="${t.ink}">${escapeXml(icon)}  </tspan>`
    + `<tspan fill="${t.white}" font-weight="700">${escapeXml(label)}</tspan>`
    + `<tspan fill="${t.ink}">: ${escapeXml(body)}</tspan>`
    + `</text>`;
}

export function renderAbout(data, t = tokyonight) {
  const lines = data.about || [];
  const inner = cardTitle('🧠', 'About Me', t)
    + lines.map((l, i) => aboutLine(TOP + i * ROW_H, l, t)).join('');
  return svgFrame(800, TOP + lines.length * ROW_H + 4, inner, t);
}
