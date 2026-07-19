import { svgFrame, text, cardTitle, tokyonight } from '../lib/theme.mjs';

const clip = (s, n) => { const a = [...s]; return a.length > n ? a.slice(0, n - 1).join('') + '…' : s; };

export function renderTopRepos(data, t = tokyonight) {
  const repos = data.topRepos;
  const W = 800, padX = 28, top = 90, rowH = 58;
  const inner = [cardTitle('📌', 'Top Repositories', t)];
  repos.forEach((r, i) => {
    const y = top + i * rowH;
    inner.push(text(padX, y, r.name, { fill: t.title, size: 16, weight: 600 }, t));
    inner.push(text(padX, y + 22, clip(r.description, 58), { fill: t.dim, size: 13 }, t));
    inner.push(`<circle cx="600" cy="${y - 5}" r="6" fill="${r.langColor}"/>`);
    inner.push(text(615, y, r.language, { fill: t.ink, size: 13 }, t));
    inner.push(text(770, y, `★ ${r.stars}`, { fill: t.gold, size: 14, weight: 600, anchor: 'end' }, t));
    if (i < repos.length - 1) inner.push(`<line x1="${padX}" y1="${y + 34}" x2="${W - padX}" y2="${y + 34}" stroke="${t.line}"/>`);
  });
  return svgFrame(W, top + (repos.length - 1) * rowH + 56, inner.join(''), t);
}
