import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { renderActivityGraph } from './activity-graph.mjs';

const data = JSON.parse(readFileSync(new URL('../fixtures/sample.json', import.meta.url)));

test('renderActivityGraph draws a 30-day area chart with a contributions footer', () => {
  const svg = renderActivityGraph(data);
  assert.match(svg, /^<svg /);
  assert.match(svg, /last 30 days/);
  assert.match(svg, /<polyline/);
  assert.match(svg, /contributions/);
});

test('renderActivityGraph labels the x-axis with the first and last day dates', () => {
  const svg = renderActivityGraph(data);
  assert.match(svg, /Jun|Jul|May/);
});
