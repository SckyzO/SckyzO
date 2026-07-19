import { svgFrame, text, tokyonight } from '../lib/theme.mjs';

const ICON = { push: ['⬆', 'green'], pr: ['⎇', 'accent'], star: ['★', 'gold'], issue: ['◎', 'teal'], repo: ['◆', 'title'] };
const VERB = { push: 'Pushed', pr: 'Merged', star: 'Starred', issue: 'Opened', repo: 'Created repo' };

export function renderActivity(data, t = tokyonight) {
  const evs = data.activity;
  const W = 430, rowH = 26, top = 52;
  const inner = [text(20, 34, '⚡ Recent Activity', { fill: t.title, size: 14, weight: 600 })];
  evs.forEach((e, i) => {
    const y = top + i * rowH;
    const [glyph, colorKey] = ICON[e.type] || ['•', 'ink'];
    const line = `${VERB[e.type] || ''} ${e.detail ? e.detail + ' · ' : ''}${e.repo.split('/').pop()}`.trim();
    inner.push(text(20, y, glyph, { fill: t[colorKey], size: 12, mono: true }));
    inner.push(text(40, y, line, { fill: t.ink, size: 12 }));
  });
  return svgFrame(W, top + evs.length * rowH, inner.join(''), t);
}
