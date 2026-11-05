// Language share as a pie chart. It is decorative: the language names and
// percentages are written as text right below it, and each slice takes the
// colour of the emoji square that labels it there, so the chart and its legend
// always agree.

// Approximate rendered colours of the coloured-square emoji.
export const EMOJI_COLORS = {
  '🟥': '#DD2E44', '🟧': '#F4900C', '🟨': '#FDCB58', '🟩': '#78B159', '🟦': '#55ACEE',
  '🟪': '#AA8ED6', '🟫': '#C1694F', '⬛': '#57606A', '⬜': '#D0D7DE',
};

const SIZE = 220;
const C = SIZE / 2;
const R = 100;
// Each slice is pushed outward along its bisector, which opens a gap between
// slices that shows the page itself, so it works on light and dark themes alike.
const GAP = 2.5;

const round = (n) => Math.round(n * 100) / 100;
const point = (angle, r, dx, dy) => [round(C + dx + r * Math.sin(angle)), round(C + dy - r * Math.cos(angle))];

/** `languages` = [{ name, pct }], `squareFor(name)` = the legend emoji of that language. */
export function renderLanguagePie(languages, squareFor) {
  const shown = languages.filter((l) => l.pct > 0);
  const total = shown.reduce((s, l) => s + l.pct, 0);
  const color = (l) => EMOJI_COLORS[squareFor(l.name)] || EMOJI_COLORS['⬛'];
  let body;
  if (shown.length === 1) {
    body = `<circle cx="${C}" cy="${C}" r="${R}" fill="${color(shown[0])}"/>`;
  } else {
    let start = 0; // radians, clockwise from 12 o'clock
    body = shown.map((l) => {
      const sweep = (l.pct / total) * 2 * Math.PI;
      const mid = start + sweep / 2;
      const dx = GAP * Math.sin(mid);
      const dy = -GAP * Math.cos(mid);
      const [x1, y1] = point(start, R, dx, dy);
      const [x2, y2] = point(start + sweep, R, dx, dy);
      const large = sweep > Math.PI ? 1 : 0;
      start += sweep;
      return `<path d="M${round(C + dx)} ${round(C + dy)}L${x1} ${y1}A${R} ${R} 0 ${large} 1 ${x2} ${y2}Z" fill="${color(l)}"/>`;
    }).join('');
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}" role="img" aria-label="language share">${body}</svg>`;
}
