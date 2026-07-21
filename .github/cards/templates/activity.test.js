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

test('renderActivity shows a relative time per event', () => {
  const d = { activity: [{ type: 'push', repo: 'o/r', detail: '3 commits', when: '2026-07-19T00:00:00Z' }] };
  const svg = renderActivity(d, undefined, Date.parse('2026-07-20T00:00:00Z'));
  assert.match(svg, /Pushed 3 commits · r · yesterday/);
});

test('renderActivity omits an empty detail without leaving a dangling separator', () => {
  const d = { activity: [{ type: 'push', repo: 'o/r', detail: '', when: '2026-07-19T00:00:00Z' }] };
  const svg = renderActivity(d, undefined, Date.parse('2026-07-22T00:00:00Z'));
  assert.match(svg, /Pushed · r · 3d ago/);
  assert.doesNotMatch(svg, /· ·/);
});
