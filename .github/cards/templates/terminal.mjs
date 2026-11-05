// A fake terminal that types one line at a time, replacing the external
// readme-typing-svg service. Decorative: the README states the same facts in text.

const WIDTH = 600;
const HEIGHT = 100;
const FONT = "ui-monospace,SFMono-Regular,Menlo,Consolas,'DejaVu Sans Mono',monospace";
const FONT_SIZE = 15;
// Monospace advance ≈ 0.6em; slightly over-estimated so the reveal never cuts a glyph.
const CHAR_W = FONT_SIZE * 0.62;
const X0 = 18;
const TYPE_S_PER_CHAR = 0.07;
const HOLD_S = 2.2;

const escapeXml = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const round = (n) => Math.round(n * 10000) / 10000;

/** SMIL keyframes from [fraction, value] points; the first point must be at 0 and the last at 1. */
function keyframes(points) {
  return { keyTimes: points.map(([t]) => round(t)).join(';'), values: points.map(([, v]) => v).join(';') };
}

/** Timeline: line i is typed, held, then replaced by line i+1; the loop restarts after the last line. */
export function schedule(lines) {
  const slots = lines.map((l) => ({ type: Math.max(0.5, l.length * TYPE_S_PER_CHAR), hold: HOLD_S }));
  const total = slots.reduce((s, x) => s + x.type + x.hold, 0);
  let at = 0;
  return {
    total: round(total),
    lines: slots.map((x) => {
      const start = at / total;
      const typed = (at + x.type) / total;
      at += x.type + x.hold;
      return { start, typed, end: at / total };
    }),
  };
}

function lineGroup(text, i, { start, typed, end }, accent, dur) {
  const w = Math.ceil(text.length * CHAR_W);
  const visible = start === 0
    ? keyframes([[0, 1], [end, 0], [1, 0]])
    : keyframes([[0, 0], [start, 1], [end, 0], [1, 0]]);
  const reveal = start === 0
    ? [[0, 0], [typed, w], [1, w]]
    : [[0, 0], [start, 0], [typed, w], [1, w]];
  const clip = keyframes(reveal);
  const cursor = keyframes(reveal.map(([t, v]) => [t, X0 + v + 2]));
  const anim = (attr, k, mode = 'linear') => `<animate attributeName="${attr}" dur="${dur}s" repeatCount="indefinite" calcMode="${mode}" keyTimes="${k.keyTimes}" values="${k.values}"/>`;
  return `<g opacity="${start === 0 ? 1 : 0}">${anim('opacity', visible, 'discrete')}`
    + `<clipPath id="t${i}"><rect x="${X0}" y="62" width="0" height="26">${anim('width', clip)}</rect></clipPath>`
    + `<text x="${X0}" y="81" fill="${accent}" clip-path="url(#t${i})">${escapeXml(text)}</text>`
    + `<rect x="${X0 + 2}" y="67" width="${Math.round(CHAR_W)}" height="18" fill="${accent}">${anim('x', cursor)}`
    + `<animate attributeName="opacity" dur="1s" repeatCount="indefinite" calcMode="discrete" values="1;0"/></rect></g>`;
}

export function renderTerminal({ prompt, command, lines, accent = '#0FF8FC' }) {
  if (!lines.length) throw new Error('terminal: at least one line is required');
  const { total, lines: slots } = schedule(lines);
  const promptW = Math.ceil(prompt.length * CHAR_W);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" role="img" aria-label="terminal">`
    + `<rect x="0.5" y="0.5" width="${WIDTH - 1}" height="${HEIGHT - 1}" rx="8" fill="#0D1117" stroke="#30363D"/>`
    + `<circle cx="16" cy="13" r="5" fill="#FF5F56"/><circle cx="32" cy="13" r="5" fill="#FFBD2E"/><circle cx="48" cy="13" r="5" fill="#27C93F"/>`
    + `<g font-family="${FONT}" font-size="${FONT_SIZE}">`
    + `<text x="${WIDTH / 2}" y="17" fill="#8B949E" font-size="11" text-anchor="middle">${escapeXml(prompt.replace(/[:$#>\s~]+$/, ''))} — zsh</text>`
    + `<text x="${X0}" y="52"><tspan fill="#3FB950">${escapeXml(prompt)}</tspan><tspan x="${X0 + promptW + 8}" fill="#E6EDF3">${escapeXml(command)}</tspan></text>`
    + slots.map((s, i) => lineGroup(lines[i], i, s, accent, total)).join('')
    + `</g></svg>`;
}
