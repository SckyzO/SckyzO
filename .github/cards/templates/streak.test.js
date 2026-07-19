import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { renderStreak } from './streak.mjs';

const data = JSON.parse(readFileSync(new URL('../fixtures/sample.json', import.meta.url)));

test('renderStreak shows total, current and longest', () => {
  const svg = renderStreak(data);
  assert.match(svg, /^<svg /);
  assert.match(svg, /6,?842|6842/);
  assert.match(svg, />37</);
  assert.match(svg, />129</);
});
