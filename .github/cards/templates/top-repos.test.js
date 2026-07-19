import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { renderTopRepos } from './top-repos.mjs';

const data = JSON.parse(readFileSync(new URL('../fixtures/sample.json', import.meta.url)));

test('renderTopRepos lists repo names, stars and language dots', () => {
  const svg = renderTopRepos(data);
  assert.match(svg, /prom-github-exporter/);
  assert.match(svg, /128/);
  assert.match(svg, /#00ADD8/i); // language color dot
});
