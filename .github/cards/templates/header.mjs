import { tokyonight } from '../lib/theme.mjs';

// Wave path keyframes extracted verbatim from capsule-render (type=waving) for
// each section. Every path carries its own <animate>: a 4-keyframe `values`
// list (loop back to the start), `dur="20s"`, and a `begin` offset. The two
// paths per section share the same keyframes but start 10s apart, so they
// drift permanently out of phase — that's the parallax "double wave" look.
const WAVES = {
  header: [
    {
      begin: '0s',
      values: [
        'M0 0L 0 20Q 213.5 60 427 30T 854 55L 854 0 Z',
        'M0 0L 0 45Q 213.5 60 427 40T 854 30L 854 0 Z',
        'M0 0L 0 65Q 213.5 35 427 65T 854 30L 854 0 Z',
        'M0 0L 0 20Q 213.5 60 427 30T 854 55L 854 0 Z',
      ],
    },
    {
      begin: '-10s',
      values: [
        'M0 0L 0 35Q 213.5 80 427 50T 854 60L 854 0 Z',
        'M0 0L 0 50Q 213.5 20 427 20T 854 40L 854 0 Z',
        'M0 0L 0 45Q 213.5 25 427 50T 854 65L 854 0 Z',
        'M0 0L 0 35Q 213.5 80 427 50T 854 60L 854 0 Z',
      ],
    },
  ],
  // Same keyframes as the header in the extracted capsule-render source — the
  // two sections only differ by the `transform` below, not by the wave shape.
  footer: [
    {
      begin: '0s',
      values: [
        'M0 0L 0 20Q 213.5 60 427 30T 854 55L 854 0 Z',
        'M0 0L 0 45Q 213.5 60 427 40T 854 30L 854 0 Z',
        'M0 0L 0 65Q 213.5 35 427 65T 854 30L 854 0 Z',
        'M0 0L 0 20Q 213.5 60 427 30T 854 55L 854 0 Z',
      ],
    },
    {
      begin: '-10s',
      values: [
        'M0 0L 0 35Q 213.5 80 427 50T 854 60L 854 0 Z',
        'M0 0L 0 50Q 213.5 20 427 20T 854 40L 854 0 Z',
        'M0 0L 0 45Q 213.5 25 427 50T 854 65L 854 0 Z',
        'M0 0L 0 35Q 213.5 80 427 50T 854 60L 854 0 Z',
      ],
    },
  ],
};

// capsule-render flips the header horizontally; the footer is left as-is.
const TRANSFORM = { header: 'scale (-1, 1)', footer: null };

const HOUR_MS = 3.6e6;

/**
 * Deterministically picks one gradient (an array of hex stops) out of
 * `gradients` for a given instant. The original capsule-render used
 * `color=gradient`, which returned a genuinely random palette on every
 * request; we reproduce the "the banner's colour keeps changing" effect
 * without randomness so a given `now` always resolves to the same result —
 * needed both for reproducible tests and for header/footer to agree within
 * a single generate.mjs run. Rotates hourly; cards.yml regenerates every 6h,
 * so consecutive scheduled runs usually land on a different palette.
 */
export function pickGradient(gradients, now = Date.now()) {
  return gradients[Math.floor(now / HOUR_MS) % gradients.length];
}

const DEFAULT_STOPS = ['#7aa2f7', '#bb9af7', '#7dcfff'];

function gradientTag(id, stops) {
  const stopEls = stops
    .map((color, i) => {
      const offset = stops.length === 1 ? 0 : Math.round((i / (stops.length - 1)) * 100);
      return `<stop offset="${offset}%" stop-color="${color}"/>`;
    })
    .join('');
  return `<linearGradient id="${id}" x1="0%" y1="0%" x2="100%" y2="0%">${stopEls}</linearGradient>`;
}

function renderPath(id, waveDef, transform) {
  const { begin, values } = waveDef;
  const transformAttr = transform ? ` transform="${transform}" transform-origin="center"` : '';
  // NOTE: capsule-render's own output emits a typo'd `calcmod="spline"` attribute,
  // which SVG does not recognize — browsers silently fall back to linear easing.
  // We emit the correctly-spelled `calcMode="spline"` so the eased, organic
  // motion the spline keySplines describe actually applies.
  const animate = `<animate attributeName="d" dur="20s" repeatCount="indefinite" calcMode="spline" keyTimes="0;0.333;0.667;1" keySplines="0.2 0 0.2 1;0.2 0 0.2 1;0.2 0 0.2 1" begin="${begin}" values="${values.join(';')}"/>`;
  return `<path d="${values[0]}" fill="url(#${id})" opacity="0.4"${transformAttr}>${animate}</path>`;
}

export function renderHeader(_data, _t = tokyonight, section = 'header', stops = DEFAULT_STOPS) {
  const id = `cap-${section}`;
  const waveDefs = WAVES[section] || WAVES.header;
  const transform = TRANSFORM[section] ?? null;
  const paths = waveDefs.map((w) => renderPath(id, w, transform)).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="854" height="100" viewBox="0 0 854 100" role="img" aria-label="profile ${section}">`
    + `<defs>${gradientTag(id, stops)}</defs>`
    + `<style>.cap-wave{animation:fadeIn 1.2s ease-in-out forwards}@keyframes fadeIn{from{opacity:0}to{opacity:1}}</style>`
    + `<g class="cap-wave">${paths}</g>`
    + `</svg>`;
}

export function renderFooter(data, t = tokyonight, stops = DEFAULT_STOPS) {
  return renderHeader(data, t, 'footer', stops);
}
