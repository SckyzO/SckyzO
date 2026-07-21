import { svgFrame, text, cardTitle, tokyonight } from '../lib/theme.mjs';
import { relativeTime } from '../lib/transform.mjs';

const ICON = { push: ['⬆', 'green'], pr: ['⎇', 'accent'], star: ['★', 'gold'], issue: ['◎', 'teal'], repo: ['◆', 'title'] };
const VERB = { push: 'Pushed', pr: 'Merged', star: 'Starred', issue: 'Opened', repo: 'Created repo' };

// `now` is injectable so tests are deterministic; the generator passes build time.
export function renderActivity(data, t = tokyonight, now = Date.now()) {
  const evs = data.activity;
  const W = 800, padX = 28, top = 90, rowH = 34;
  const inner = [cardTitle('⚡', 'Recent Activity', t)];
  evs.forEach((e, i) => {
    const y = top + i * rowH;
    const [glyph, colorKey] = ICON[e.type] || ['•', 'ink'];
    // "Pushed 6 commits · repo · yesterday" — drop any empty segment (e.g. an
    // unknown commit count) so no dangling "·" separators appear.
    const head = `${VERB[e.type] || ''}${e.detail ? ' ' + e.detail : ''}`.trim();
    const line = [head, e.repo.split('/').pop(), relativeTime(e.when, now)].filter(Boolean).join(' · ');
    inner.push(text(padX, y, glyph, { fill: t[colorKey], size: 15 }, t));
    inner.push(text(padX + 24, y, line, { fill: t.ink, size: 15 }, t));
  });
  return svgFrame(W, top + (evs.length - 1) * rowH + 40, inner.join(''), t);
}
