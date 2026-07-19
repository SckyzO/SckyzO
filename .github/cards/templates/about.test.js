import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { renderAbout } from './about.mjs';

const data = JSON.parse(readFileSync(new URL('../fixtures/sample.json', import.meta.url)));

test('renderAbout shows the title and bio lines with a bold label', () => {
  const svg = renderAbout(data);
  assert.match(svg, /^<svg /);
  assert.match(svg, /About Me/);
  assert.match(svg, /font-weight="700">Identity</);
  assert.match(svg, /Toulouse/);
});
