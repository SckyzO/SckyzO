import { svgFrame, text, tokyonight } from '../lib/theme.mjs';

const clip = (s, n) => (s.length > n ? s.slice(0, n - 1) + '…' : s);

export function renderTopRepos(data, t = tokyonight) {
  const repos = data.topRepos;
  const W = 430, rowH = 34, top = 52;
  const inner = [text(20, 34, '📌 Top Repositories', { fill: t.title, size: 14, weight: 600 })];
  repos.forEach((r, i) => {
    const y = top + i * rowH;
    inner.push(text(20, y, r.name, { fill: t.title, size: 13, weight: 600, mono: true }));
    inner.push(text(20, y + 15, clip(r.description, 52), { fill: t.dim, size: 11 }));
    inner.push(`<circle cx="322" cy="${y - 4}" r="5" fill="${r.langColor}"/>`);
    inner.push(text(334, y, r.language, { fill: t.ink, size: 11, mono: true }));
    inner.push(text(410, y, `★ ${r.stars}`, { fill: t.gold, size: 11, anchor: 'end', mono: true }));
    if (i < repos.length - 1) inner.push(`<line x1="20" y1="${y + 24}" x2="410" y2="${y + 24}" stroke="${t.line}"/>`);
  });
  return svgFrame(W, top + repos.length * rowH, inner.join(''), t);
}
