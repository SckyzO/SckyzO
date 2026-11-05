// Thin gradient rule placed under each README heading, in the gradient of the
// day, so headings, header and footer share one colour scheme.
const WIDTH = 854;
const HEIGHT = 4;

export function renderDivider(stops) {
  const stopEls = stops.map((c, i) => `<stop offset="${stops.length === 1 ? 0 : Math.round((i / (stops.length - 1)) * 100)}%" stop-color="${c}"/>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" role="img" aria-label="divider">`
    + `<defs><linearGradient id="div" x1="0%" y1="0%" x2="100%" y2="0%">${stopEls}</linearGradient></defs>`
    + `<rect width="${WIDTH}" height="${HEIGHT}" rx="${HEIGHT / 2}" fill="url(#div)"/></svg>`;
}
