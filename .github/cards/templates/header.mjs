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

// The wave paths hang from the top edge. The header is mirrored horizontally so its
// crest differs from the footer's; the footer is mirrored vertically so its waves rise
// from the bottom edge, which is where it sits at the end of the page.
const TRANSFORM = { header: 'scale (-1, 1)', footer: 'scale (1, -1)' };

import { gradientDef } from './gradient.mjs';

const DEFAULT_CYCLE = [['#7aa2f7', '#bb9af7', '#7dcfff']];

function renderPath(id, waveDef, transform, opacity) {
  const { begin, values } = waveDef;
  const transformAttr = transform ? ` transform="${transform}" transform-origin="center"` : '';
  // NOTE: capsule-render's own output emits a typo'd `calcmod="spline"` attribute,
  // which SVG does not recognize — browsers silently fall back to linear easing.
  // We emit the correctly-spelled `calcMode="spline"` so the eased, organic
  // motion the spline keySplines describe actually applies.
  const animate = `<animate attributeName="d" dur="20s" repeatCount="indefinite" calcMode="spline" keyTimes="0;0.333;0.667;1" keySplines="0.2 0 0.2 1;0.2 0 0.2 1;0.2 0 0.2 1" begin="${begin}" values="${values.join(';')}"/>`;
  return `<path d="${values[0]}" fill="url(#${id})" opacity="${opacity}"${transformAttr}>${animate}</path>`;
}

// `opacity` lets the README serve a light and a dark variant through <picture>:
// pastel gradients need more opacity to read on a white page than on a dark one.
// `cycle` = the palettes the gradient animates through (see gradient.mjs).
export function renderHeader(cycle = DEFAULT_CYCLE, section = 'header', { opacity = 0.4 } = {}) {
  const id = `cap-${section}`;
  const waveDefs = WAVES[section] || WAVES.header;
  const transform = TRANSFORM[section] ?? null;
  const paths = waveDefs.map((w) => renderPath(id, w, transform, opacity)).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="854" height="100" viewBox="0 0 854 100" role="img" aria-label="profile ${section}">`
    // The horizontal mirror also flips the fill; a reversed gradient keeps the colours
    // running left to right like the footer and the dividers.
    + `<defs>${gradientDef(id, cycle, { reversed: /^scale \(-1/.test(transform ?? '') })}</defs>`
    + `<style>.cap-wave{animation:fadeIn 1.2s ease-in-out forwards}@keyframes fadeIn{from{opacity:0}to{opacity:1}}</style>`
    + `<g class="cap-wave">${paths}</g>`
    + `</svg>`;
}

export function renderFooter(cycle = DEFAULT_CYCLE, opts = {}) {
  return renderHeader(cycle, 'footer', opts);
}
