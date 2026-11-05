// Self-hosted "for-the-badge" badges (the shields.io style of the original
// profile), rendered at build time so the README depends on no badge service.
// Badges are images, so every one is placed with an alt text naming the tool.

const HEIGHT = 28;
const FONT = 'Verdana,Geneva,DejaVu Sans,sans-serif';
const FONT_SIZE = 10;
const LETTER_SPACING = 1;
const PAD = 12;
const ICON = 14;
const ICON_GAP = 6;

// Approximate advance widths of uppercase Verdana Bold at 10px. `textLength`
// pins the drawn text to the estimate, so a fallback font cannot overflow the badge.
const WIDE = { M: 9.5, W: 11, O: 8.5, Q: 8.5, D: 8.3, H: 8.4, N: 8.4, G: 8.1, U: 8.1 };
const NARROW = { I: 4.8, J: 5.4, ' ': 3.4, '.': 3.6, ',': 3.6, '-': 4.5, '+': 7, '&': 8.2 };
const DEFAULT_WIDTH = 7.4;

export function textWidth(text) {
  const chars = [...text.toUpperCase()];
  const glyphs = chars.reduce((s, c) => s + (WIDE[c] ?? NARROW[c] ?? DEFAULT_WIDTH), 0);
  return Math.round(glyphs + LETTER_SPACING * Math.max(0, chars.length - 1));
}

export function badgeSlug(label) {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

const escapeXml = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function textEl(text, x, width, color) {
  return `<text x="${x}" y="18" fill="${color}" font-family="${FONT}" font-size="${FONT_SIZE}" font-weight="bold" letter-spacing="${LETTER_SPACING}" textLength="${width}" lengthAdjust="spacingAndGlyphs">${escapeXml(text.toUpperCase())}</text>`;
}

// Simple Icons paths are drawn on a 24×24 grid.
function iconEl(paths, x, color) {
  const scale = ICON / 24;
  return `<g transform="translate(${x} ${(HEIGHT - ICON) / 2}) scale(${scale})" fill="${color}">${paths.map((d) => `<path d="${escapeXml(d)}"/>`).join('')}</g>`;
}

function svg(width, label, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${HEIGHT}" viewBox="0 0 ${width} ${HEIGHT}" role="img" aria-label="${escapeXml(label)}">${body}</svg>`;
}

/** One-part badge: [icon] LABEL on a brand colour. `iconPaths` = SVG path data, or [] for no icon. */
export function renderBadge({ label, color, textColor = '#FFFFFF', iconPaths = [] }) {
  const tw = textWidth(label);
  const textX = iconPaths.length ? PAD - 2 + ICON + ICON_GAP : PAD;
  const width = textX + tw + PAD;
  const icon = iconPaths.length ? iconEl(iconPaths, PAD - 2, textColor) : '';
  return svg(width, label, `<rect width="${width}" height="${HEIGHT}" fill="${color}"/>${icon}${textEl(label, textX, tw, textColor)}`);
}

/** Two-part badge: grey LABEL | coloured VALUE, like the original followers badge. */
export function renderValueBadge({ label, value, color }) {
  const lw = textWidth(label);
  const vw = textWidth(String(value));
  const left = PAD + lw + PAD;
  const width = left + PAD + vw + PAD;
  return svg(width, `${label}: ${value}`,
    `<rect width="${left}" height="${HEIGHT}" fill="#555555"/><rect x="${left}" width="${width - left}" height="${HEIGHT}" fill="${color}"/>`
    + textEl(label, PAD, lw, '#FFFFFF') + textEl(String(value), left + PAD, vw, '#FFFFFF'));
}

/** Path data of a Simple Icons SVG file. */
export function iconPathsFrom(svgSource) {
  return [...svgSource.matchAll(/<path[^>]*\sd="([^"]+)"/g)].map((m) => m[1]);
}
