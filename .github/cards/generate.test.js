import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { renderAll, updateReadme } from './generate.mjs';
import { KNOWN_CARDS } from './config.js';
import { makeTheme, cardTitle } from './lib/theme.mjs';
import { renderStats } from './templates/stats.mjs';

const data = JSON.parse(readFileSync(new URL('./fixtures/sample.json', import.meta.url)));

test('renderAll returns one svg per requested card', () => {
  const out = renderAll(data, ['stats', 'streak', 'languages']);
  assert.deepEqual(Object.keys(out).sort(), ['languages', 'stats', 'streak']);
  for (const svg of Object.values(out)) assert.match(svg, /^<svg /);
});

test('renderAll ignores unknown cards defensively', () => {
  const out = renderAll(data, ['stats', 'nope']);
  assert.deepEqual(Object.keys(out), ['stats']);
});

test('every known card has a registered renderer', () => {
  const out = renderAll(data, KNOWN_CARDS);
  assert.equal(Object.keys(out).length, KNOWN_CARDS.length);
});

test('renderAll threads a custom theme palette into the rendered svg', () => {
  const out = renderAll(data, ['about'], makeTheme({ palette: { bg: '#123456' } }));
  assert.match(out.about, /#123456/);
});

test('renderAll falls back to the default tokyonight palette without a theme arg', () => {
  const out = renderAll(data, ['about']);
  assert.match(out.about, /#1a1b27/);
});

// Regression: text()'s `fill` default used to resolve from the module-level
// tokyonight constant instead of the passed theme, so callers that omit
// `fill` (cardTitle's emoji glyph, stats' row labels) silently ignored a
// configured palette.ink override.
test('a configured palette.ink override reaches text() calls that omit fill', () => {
  const theme = makeTheme({ palette: { ink: '#ff00ff' } });
  assert.match(cardTitle('📊', 'GitHub Stats', theme), /fill="#ff00ff"/);
  assert.match(renderStats(data, theme), /fill="#ff00ff"/);
});

test('updateReadme injects generated sections into the README file in place', () => {
  const dir = mkdtempSync(join(tmpdir(), 'cards-readme-'));
  const path = join(dir, 'README.md');
  const names = ['stats', 'languages', 'projects', 'contributions', 'releases'];
  writeFileSync(path, ['# Hi', ...names.map((n) => `<!-- cards:${n}:start -->\nstale\n<!-- cards:${n}:end -->`)].join('\n'));
  try {
    updateReadme(path, {
      profile: { repoCount: 2, years: 3 }, stats: { stars: 4, commits: 5 },
      languages: [{ name: 'Go', pct: 100 }], projects: [], contributions: [], releases: [],
    }, {});
    const out = readFileSync(path, 'utf8');
    assert.ok(out.startsWith('# Hi\n'), 'hand-written content is preserved');
    assert.doesNotMatch(out, /stale/);
    assert.match(out, /📦 \*\*2\*\*/u);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
