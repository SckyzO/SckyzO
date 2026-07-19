export const tokyonight = {
  bg: '#1a1b27', ink: '#a9b1d6', dim: '#565f89', title: '#70a5fd',
  accent: '#bf91f3', teal: '#38bdae', green: '#9ece6a', flame: '#ff9e64',
  gold: '#e2b714', line: '#2a2e42', white: '#ffffff',
};

const MONO = "ui-monospace,'JetBrains Mono',Menlo,Consolas,monospace";
const SANS = "system-ui,-apple-system,'Segoe UI',Roboto,sans-serif";

export const fmtNum = (n) => n.toLocaleString('en-US');

export const escapeXml = (s) =>
  String(s).replace(/[<>&'"]/g, (c) =>
    ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c]));

export function text(x, y, str, { fill = tokyonight.ink, size = 13, weight = 400, anchor = 'start', mono = false } = {}) {
  return `<text x="${x}" y="${y}" fill="${fill}" font-size="${size}" font-weight="${weight}" `
    + `text-anchor="${anchor}" font-family="${mono ? MONO : SANS}">${escapeXml(str)}</text>`;
}

export function svgFrame(w, h, inner, t = tokyonight) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="GitHub profile card">`
    + `<rect x="0.5" y="0.5" width="${w - 1}" height="${h - 1}" rx="10" fill="${t.bg}" stroke="${t.line}"/>`
    + inner + `</svg>`;
}
