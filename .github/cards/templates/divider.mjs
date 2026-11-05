import { gradientDef } from './gradient.mjs';

// Thin rule placed under each README heading. It cycles through the same
// colours as the waves, so headings, header and footer move together.
const WIDTH = 854;
const HEIGHT = 4;

export function renderDivider(cycle) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" role="img" aria-label="divider">`
    + `<defs>${gradientDef('div', cycle)}</defs>`
    + `<rect width="${WIDTH}" height="${HEIGHT}" rx="${HEIGHT / 2}" fill="url(#div)"/></svg>`;
}
