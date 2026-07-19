import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { renderAbout } from './about.mjs';

const data = JSON.parse(readFileSync(new URL('../fixtures/sample.json', import.meta.url)));

test('renderAbout shows the title and bio lines', () => {
  const svg = renderAbout(data);
  assert.match(svg, /^<svg /);
  assert.match(svg, /About Me/);
  assert.match(svg, /Toulouse/);
});
