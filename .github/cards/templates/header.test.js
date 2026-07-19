import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderHeader, renderFooter } from './header.mjs';

test('renderHeader draws an 800-wide gradient wave', () => {
  const svg = renderHeader({});
  assert.match(svg, /<path/);
  assert.match(svg, /linearGradient/);
  assert.match(svg, /width="800"/);
});

test('renderFooter uses a different wave path than the header', () => {
  const header = renderHeader({});
  const footer = renderFooter({});
  const pathOf = (svg) => svg.match(/<path d="([^"]+)"/)[1];
  assert.notEqual(pathOf(header), pathOf(footer));
});
