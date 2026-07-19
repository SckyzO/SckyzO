const FONT = "'Segoe UI',Ubuntu,'Helvetica Neue',Sans-Serif";
export const tokyonight = { bg: '#1a1b27', ink: '#a9b1d6', dim: '#565f89', title: '#70a5fd', accent: '#bf91f3', teal: '#38bdae', green: '#9ece6a', flame: '#ff9e64', gold: '#e2b714', line: '#2a2e42', white: '#ffffff', font: FONT };

/**
 * Builds a theme object shaped exactly like `tokyonight`: the 11 palette
 * keys plus `font`. `palette` overrides are shallow-merged over the
 * tokyonight defaults; unset keys (including a fully-omitted `palette`)
 * fall back to tokyonight so an unconfigured caller gets byte-identical
 * output to the hardcoded theme this replaces.
 */
export function makeTheme({ palette = {}, font } = {}) {
  return { ...tokyonight, ...palette, font: font || tokyonight.font };
}

export const escapeXml = (s) => String(s).replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c]));
export const fmtNum = (n) => n.toLocaleString('en-US');
export function text(x, y, str, opts = {}, t = tokyonight) {
  const { fill = t.ink, size = 15, weight = 400, anchor = 'start', letterSpacing = 0, opacity = 1 } = opts;
  return `<text x="${x}" y="${y}" fill="${fill}" font-size="${size}" font-weight="${weight}" text-anchor="${anchor}" font-family="${t.font}"${letterSpacing ? ` letter-spacing="${letterSpacing}"` : ''}${opacity < 1 ? ` opacity="${opacity}"` : ''}>${escapeXml(str)}</text>`;
}
export function svgFrame(w, h, inner, t = tokyonight) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="GitHub profile card" font-family="${t.font}"><rect x="1" y="1" width="${w - 2}" height="${h - 2}" rx="14" fill="${t.bg}" stroke="${t.line}" stroke-width="1"/>${inner}</svg>`;
}
export function cardTitle(emoji, label, t = tokyonight) {
  return text(28, 46, emoji, { size: 19 }, t) + text(58, 46, label, { fill: t.title, size: 18, weight: 600 }, t);
}
