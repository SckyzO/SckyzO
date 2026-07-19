import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { renderStack, renderTools } from './stack.mjs';

const data = JSON.parse(readFileSync(new URL('../fixtures/sample.json', import.meta.url)));

test('renderStack shows the title and a colored chip per stack item', () => {
  const svg = renderStack(data);
  assert.match(svg, /^<svg /);
  assert.match(svg, /Languages &amp; Stack/);
  assert.match(svg, /<rect/);
  assert.match(svg, />Docker</);
});

test('renderTools shows the title and a colored chip per tool item', () => {
  const svg = renderTools(data);
  assert.match(svg, /^<svg /);
  assert.match(svg, /Tools &amp; Environment/);
  assert.match(svg, /<rect/);
  assert.match(svg, />Vim</);
});
