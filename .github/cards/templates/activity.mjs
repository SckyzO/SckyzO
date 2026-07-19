import { svgFrame, text, cardTitle, tokyonight } from '../lib/theme.mjs';

const ICON = { push: ['⬆', 'green'], pr: ['⎇', 'accent'], star: ['★', 'gold'], issue: ['◎', 'teal'], repo: ['◆', 'title'] };
const VERB = { push: 'Pushed', pr: 'Merged', star: 'Starred', issue: 'Opened', repo: 'Created repo' };

export function renderActivity(data, t = tokyonight) {
  const evs = data.activity;
  const W = 800, padX = 28, top = 90, rowH = 34;
  const inner = [cardTitle('⚡', 'Recent Activity', t)];
  evs.forEach((e, i) => {
    const y = top + i * rowH;
    const [glyph, colorKey] = ICON[e.type] || ['•', 'ink'];
    const line = `${VERB[e.type] || ''} ${e.detail ? e.detail + ' · ' : ''}${e.repo.split('/').pop()}`.trim();
    inner.push(text(padX, y, glyph, { fill: t[colorKey], size: 15 }, t));
    inner.push(text(padX + 24, y, line, { fill: t.ink, size: 15 }, t));
  });
  return svgFrame(W, top + (evs.length - 1) * rowH + 40, inner.join(''), t);
}
