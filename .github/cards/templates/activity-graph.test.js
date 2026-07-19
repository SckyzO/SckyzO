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

test('renderActivityGraph renders at least 3 date/axis labels', () => {
  const svg = renderActivityGraph(data);
  const dateLabels = svg.match(/Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec/g) || [];
  assert.ok(dateLabels.length >= 3, `expected >=3 date labels, got ${dateLabels.length}`);
});

test('renderActivityGraph titles the card with the actual configured day count', () => {
  const shortData = { activityGraph: data.activityGraph.slice(-12) };
  const svg = renderActivityGraph(shortData);
  assert.match(svg, /last 12 days/);
});
