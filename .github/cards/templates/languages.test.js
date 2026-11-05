import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderLanguageBar, EMOJI_COLORS } from './languages.mjs';

const square = (name) => ({ Go: '🟩', Python: '🟨' })[name] || '⬛';
const rects = (svg) => [...svg.matchAll(/<rect x="(\d+)" y="0" width="(\d+)" height="10" fill="([^"]+)"\/>/g)]
  .map(([, x, w, fill]) => ({ x: +x, w: +w, fill }));

test('renderLanguageBar fills the full width, one segment per language, in legend colours', () => {
  const r = rects(renderLanguageBar([{ name: 'Go', pct: 75 }, { name: 'Python', pct: 20 }, { name: 'Zig', pct: 5 }], square));
  assert.deepEqual(r.map((s) => s.fill), [EMOJI_COLORS['🟩'], EMOJI_COLORS['🟨'], EMOJI_COLORS['⬛']]);
  const last = r.at(-1);
  assert.equal(last.x + last.w, 854, 'the bar ends flush with the right edge');
  assert.equal(r[1].x, r[0].w + 2, 'segments are separated by a 2px gap');
});

test('renderLanguageBar skips 0 % languages and keeps a tiny language visible', () => {
  const r = rects(renderLanguageBar([{ name: 'Go', pct: 100 }, { name: 'Python', pct: 0 }], square));
  assert.equal(r.length, 1);
  assert.equal(r[0].w, 854);
  const tiny = rects(renderLanguageBar([{ name: 'Go', pct: 1000 }, { name: 'Python', pct: 0.01 }, { name: 'Zig', pct: 1 }], square));
  assert.ok(tiny.every((s) => s.w >= 1));
});
