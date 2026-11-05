import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderLanguagePie, EMOJI_COLORS } from './languages.mjs';

const square = (name) => ({ Go: '🟩', Python: '🟨' })[name] || '⬛';
const slices = (svg) => [...svg.matchAll(/<path d="([^"]+)" fill="([^"]+)"\/>/g)].map(([, d, fill]) => ({ d, fill }));

test('renderLanguagePie draws one slice per language, in legend colours', () => {
  const s = slices(renderLanguagePie([{ name: 'Go', pct: 75 }, { name: 'Python', pct: 20 }, { name: 'Zig', pct: 5 }], square));
  assert.deepEqual(s.map((x) => x.fill), [EMOJI_COLORS['🟩'], EMOJI_COLORS['🟨'], EMOJI_COLORS['⬛']]);
  assert.match(s[0].d, /A100 100 0 1 1 /, 'a slice over half the pie uses the large-arc flag');
  assert.match(s[1].d, /A100 100 0 0 1 /);
});

test('renderLanguagePie starts at 12 o\'clock and pushes slices apart', () => {
  const [first] = slices(renderLanguagePie([{ name: 'Go', pct: 50 }, { name: 'Python', pct: 50 }], square));
  // The first half-pie spans 12 → 6 o'clock; its bisector points to 3 o'clock, so it moves right by the gap.
  assert.match(first.d, /^M112\.5 110L112\.5 10A/);
});

test('renderLanguagePie draws a full disc for a single language and skips 0 % entries', () => {
  const svg = renderLanguagePie([{ name: 'Go', pct: 100 }, { name: 'Python', pct: 0 }], square);
  assert.match(svg, /<circle cx="110" cy="110" r="100" fill="#78B159"\/>/);
  assert.equal(slices(svg).length, 0);
});
