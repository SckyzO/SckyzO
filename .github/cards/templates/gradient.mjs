// Rainbow colour cycle shared by the waves and the dividers. capsule-render's
// `color=gradient` drew a new random palette on every view; here every stop of
// the gradient animates through the whole palette list instead, so the banner
// keeps changing colour while it is on screen, with no external service.

const HOUR_MS = 3.6e6;
// Seconds spent morphing from one palette to the next.
export const SECONDS_PER_PALETTE = 6;

/**
 * The palette list rotated to start at the palette of the current hour, so
 * each daily run opens on a different colour (and a static render, which
 * ignores animation, still varies from day to day). Deterministic for `now`.
 */
export function cycleFrom(gradients, now = Date.now()) {
  const start = Math.floor(now / HOUR_MS) % gradients.length;
  return [...gradients.slice(start), ...gradients.slice(0, start)];
}

/** Palette shown first (and by renderers that ignore SMIL). */
export function pickGradient(gradients, now = Date.now()) {
  return cycleFrom(gradients, now)[0];
}

/**
 * Horizontal <linearGradient> whose stops animate through `cycle` (a list of
 * equally long palettes) and loop back to the first one.
 */
export function gradientDef(id, cycle) {
  const [first] = cycle;
  const dur = cycle.length * SECONDS_PER_PALETTE;
  const stops = first.map((color, i) => {
    const offset = first.length === 1 ? 0 : Math.round((i / (first.length - 1)) * 100);
    const animate = cycle.length > 1
      ? `<animate attributeName="stop-color" dur="${dur}s" repeatCount="indefinite" values="${[...cycle, first].map((p) => p[i]).join(';')}"/>`
      : '';
    return `<stop offset="${offset}%" stop-color="${color}">${animate}</stop>`;
  }).join('');
  return `<linearGradient id="${id}" x1="0%" y1="0%" x2="100%" y2="0%">${stops}</linearGradient>`;
}
