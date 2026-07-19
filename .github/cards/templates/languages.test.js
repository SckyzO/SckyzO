import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { renderLanguages } from './languages.mjs';

const data = JSON.parse(readFileSync(new URL('../fixtures/sample.json', import.meta.url)));

test('renderLanguages draws a stacked bar and legend', () => {
  const svg = renderLanguages(data);
  assert.match(svg, /Most Used Languages/);
  assert.match(svg, /Go/);
  assert.match(svg, /34%/);
});
