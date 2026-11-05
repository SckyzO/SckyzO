import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderDivider } from './divider.mjs';

test('renderDivider spreads the gradient stops across a full-width rounded rule', () => {
  const svg = renderDivider(['#111111', '#222222', '#333333']);
  assert.match(svg, /viewBox="0 0 854 4"/);
  assert.match(svg, /<stop offset="0%" stop-color="#111111"\/><stop offset="50%" stop-color="#222222"\/><stop offset="100%" stop-color="#333333"\/>/);
  assert.match(svg, /rx="2" fill="url\(#div\)"/);
});
