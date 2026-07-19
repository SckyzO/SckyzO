import { tokyonight } from '../lib/theme.mjs';
export function renderHeader(_data, t = tokyonight, section = 'header') {
  const W = 800, H = 120, footer = section === 'footer';
  const wave = footer
    ? 'M0,70 C160,30 320,100 480,60 C620,26 720,74 800,44 L800,120 L0,120 Z'
    : 'M0,50 C160,90 320,20 480,60 C620,94 720,46 800,76 L800,0 L0,0 Z';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="profile ${section}">`
    + `<defs><linearGradient id="cap-${section}" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stop-color="#7aa2f7"/><stop offset="0.5" stop-color="#bb9af7"/><stop offset="1" stop-color="#7dcfff"/></linearGradient></defs>`
    + `<path d="${wave}" fill="url(#cap-${section})"/></svg>`;
}
export function renderFooter(data, t = tokyonight) { return renderHeader(data, t, 'footer'); }
