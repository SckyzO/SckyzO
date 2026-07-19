import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { renderStats } from './stats.mjs';

const data = JSON.parse(readFileSync(new URL('../fixtures/sample.json', import.meta.url)));

test('renderStats is a valid svg containing the figures and grade', () => {
  const svg = renderStats(data);
  assert.match(svg, /^<svg /);
  assert.match(svg, /<\/svg>$/);
  assert.match(svg, /318/);       // stars
  assert.match(svg, /4,?218|4218/); // commits
  assert.match(svg, />A\+</);     // grade in the ring
});
