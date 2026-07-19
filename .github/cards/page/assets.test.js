import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const read = (f) => readFileSync(join(HERE, f), 'utf8');

test('styles.css defines the core card tokens', () => {
  const css = read('styles.css');
  assert.match(css, /\.card\s*\{/);
  assert.match(css, /--title:/);
  assert.match(css, /\[data-theme="light"\]/);
});

test('app.js is data-driven (no hardcoded sample data) and wires the hooks', () => {
  const js = read('app.js');
  assert.match(js, /getElementById\(["']cards-data["']\)/);
  assert.doesNotMatch(js, /prom-github-exporter/); // mockup sample data must be gone
  for (const id of ['calGrid', 'activityGraph', 'repoBody', 'themeBtn', 'donut'])
    assert.ok(js.includes(id), `app.js must reference #${id}`);
});
