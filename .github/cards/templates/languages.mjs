// One stacked bar, GitHub-style, spanning the README width. It is decorative:
// the language names and percentages are written as text right below it, and
// each segment takes the colour of the emoji square that labels it there, so
// the bar and its legend always agree.

// Approximate rendered colours of the coloured-square emoji.
export const EMOJI_COLORS = {
  '🟥': '#DD2E44', '🟧': '#F4900C', '🟨': '#FDCB58', '🟩': '#78B159', '🟦': '#55ACEE',
  '🟪': '#AA8ED6', '🟫': '#C1694F', '⬛': '#57606A', '⬜': '#D0D7DE',
};

const WIDTH = 854;
const HEIGHT = 10;
const GAP = 2;

/** `languages` = [{ name, pct }], `squareFor(name)` = the legend emoji of that language. */
export function renderLanguageBar(languages, squareFor) {
  const shown = languages.filter((l) => l.pct > 0);
  const total = shown.reduce((s, l) => s + l.pct, 0) || 1;
  const usable = WIDTH - GAP * Math.max(0, shown.length - 1);
  let x = 0;
  const rects = shown.map((l, i) => {
    // Every segment gets 1px up front so a tiny language stays visible; the last one
    // absorbs rounding so the bar always ends flush with the right edge.
    const w = i === shown.length - 1 ? WIDTH - x : 1 + Math.floor((l.pct / total) * (usable - shown.length));
    const fill = EMOJI_COLORS[squareFor(l.name)] || EMOJI_COLORS['⬛'];
    const rect = `<rect x="${x}" y="0" width="${w}" height="${HEIGHT}" fill="${fill}"/>`;
    x += w + GAP;
    return rect;
  }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" role="img" aria-label="language share">`
    + `<defs><clipPath id="bar"><rect width="${WIDTH}" height="${HEIGHT}" rx="${HEIGHT / 2}"/></clipPath></defs>`
    + `<g clip-path="url(#bar)">${rects}</g></svg>`;
}
