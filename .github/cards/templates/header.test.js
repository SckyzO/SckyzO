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

test('header and footer capsules keep the wave animated', () => {
  for (const [name, svg] of [['header', renderHeader({})], ['footer', renderFooter({})]]) {
    assert.match(svg, /<animate attributeName="d"/, `${name} must animate its wave`);
    assert.match(svg, /repeatCount="indefinite"/, `${name} must loop`);
    // the morph needs both variants, and the path structure must match for SMIL
    const values = svg.match(/values="([^"]+)"/)[1].split(';');
    assert.equal(values.length, 3, `${name} morphs base -> alt -> base`);
    assert.equal(values[0], values[2], `${name} returns to its starting wave`);
    assert.notEqual(values[0], values[1], `${name} actually moves`);
    const cmds = (d) => d.replace(/[-\d.,]+/g, '').replace(/\s+/g, '');
    assert.equal(cmds(values[0]), cmds(values[1]), `${name} variants need identical path commands for SMIL`);
  }
});
