// Keyboard-key images for the Setup row: a raised keycap with a Lucide icon in
// the tool's colour and its name. Dark keys on both themes, like the terminal.
// Each key is placed with an alt text naming the tool.

const HEIGHT = 40;
const DEPTH = 5; // visible side of the key under its top face
const PAD = 14;
const ICON = 18;
const ICON_GAP = 8;
const FONT = "ui-monospace,SFMono-Regular,Menlo,Consolas,'DejaVu Sans Mono',monospace";
const FONT_SIZE = 13;
const CHAR_W = FONT_SIZE * 0.62;

const escapeXml = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Inner shapes of a Lucide SVG file (paths, rects, circles…), without the outer <svg>. */
export function lucideShapes(svgSource) {
  const inner = svgSource.replace(/<!--[\s\S]*?-->/g, '').match(/<svg[^>]*>([\s\S]*)<\/svg>/);
  if (!inner) throw new Error('lucide: not an SVG file');
  return inner[1].replace(/\s+/g, ' ').trim();
}

export function renderKeycap({ label, color, iconShapes }) {
  const tw = Math.ceil([...label].length * CHAR_W);
  const width = PAD + ICON + ICON_GAP + tw + PAD;
  const face = HEIGHT - DEPTH;
  const iconY = (face - ICON) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${HEIGHT}" viewBox="0 0 ${width} ${HEIGHT}" role="img" aria-label="${escapeXml(label)}">`
    + `<rect x="0.5" y="0.5" width="${width - 1}" height="${HEIGHT - 1}" rx="8" fill="#0B0F14" stroke="#30363D"/>`
    + `<rect x="1.5" y="1.5" width="${width - 3}" height="${face - 2}" rx="7" fill="#21262D" stroke="#3D444D"/>`
    + `<rect x="6" y="3" width="${width - 12}" height="1" rx="0.5" fill="#FFFFFF" opacity="0.08"/>`
    + `<g transform="translate(${PAD} ${iconY}) scale(${ICON / 24})" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${iconShapes}</g>`
    + `<text x="${PAD + ICON + ICON_GAP}" y="${face / 2 + 4.5}" fill="#E6EDF3" font-family="${FONT}" font-size="${FONT_SIZE}" font-weight="600">${escapeXml(label)}</text>`
    + `</svg>`;
}
