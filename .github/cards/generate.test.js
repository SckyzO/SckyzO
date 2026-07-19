import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { renderAll } from './generate.mjs';
import { KNOWN_CARDS } from './config.js';
import { makeTheme } from './lib/theme.mjs';

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
