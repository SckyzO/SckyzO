import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { renderTrophies } from './trophies.mjs';

const data = JSON.parse(readFileSync(new URL('../fixtures/sample.json', import.meta.url)));

test('renderTrophies shows rank chips', () => {
  const svg = renderTrophies(data);
  assert.match(svg, />S</);
  assert.match(svg, /Stars/);
});
