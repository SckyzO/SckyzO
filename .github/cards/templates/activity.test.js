import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { renderActivity } from './activity.mjs';

const data = JSON.parse(readFileSync(new URL('../fixtures/sample.json', import.meta.url)));

test('renderActivity lists events with repo names', () => {
  const svg = renderActivity(data);
  assert.match(svg, /prom-github-exporter/);
  assert.match(svg, /Recent Activity/);
});
