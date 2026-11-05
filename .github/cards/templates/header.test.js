import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderHeader, renderFooter } from './header.mjs';

test('renderHeader draws an 854-wide gradient wave', () => {
  const svg = renderHeader();
  assert.match(svg, /<path/);
  assert.match(svg, /linearGradient/);
  assert.match(svg, /viewBox="0 0 854 100"/);
});

test('the footer is flipped vertically so its waves rise from the bottom edge', () => {
  const header = renderHeader();
  const footer = renderFooter();
  assert.match(header, /transform="scale \(-1, 1\)"/, 'header flips horizontally');
  assert.match(footer, /transform="scale \(1, -1\)" transform-origin="center"/, 'footer flips vertically');
});

test('header and footer capsules each animate two superposed, out-of-phase paths', () => {
  for (const [name, svg] of [['header', renderHeader()], ['footer', renderFooter()]]) {
    const paths = [...svg.matchAll(/<path[^>]*>.*?<\/path>/gs)];
    assert.equal(paths.length, 2, `${name} needs two superposed wave paths`);
    for (const [path] of paths) {
      assert.match(path, /opacity="0\.4"/, `${name} path must be translucent for the parallax effect`);
      assert.match(path, /<animate attributeName="d"/, `${name} path must animate`);
      assert.match(path, /repeatCount="indefinite"/, `${name} must loop`);
      // capsule-render itself emits a typo'd `calcmod`; we must emit the real attribute
      // so spline easing actually applies instead of silently falling back to linear.
      assert.match(path, /calcMode="spline"/, `${name} must use the correctly-spelled calcMode`);
      assert.doesNotMatch(path, /calcmod=/, `${name} must not carry the capsule-render calcmod typo`);
      const values = path.match(/values="([^"]+)"/)[1].split(';');
      assert.equal(values.length, 4, `${name} animates across 4 keyframes`);
      assert.equal(values[0], values[3], `${name} loops back to its starting wave`);
    }
    const begins = paths.map(([path]) => path.match(/begin="([^"]+)"/)[1]);
    assert.deepEqual(begins.sort(), ['-10s', '0s'].sort(), `${name} paths must start 10s out of phase`);
  }
});

test('renderHeader/renderFooter thread the colour cycle into the SVG', () => {
  const cycle = [['#abcdef', '#123456'], ['#222222', '#333333']];
  const header = renderHeader(cycle);
  const footer = renderFooter(cycle);
  for (const svg of [header, footer]) {
    assert.match(svg, /#abcdef/);
    assert.match(svg, /#123456/);
    assert.match(svg, /attributeName="stop-color"[^>]*values="#abcdef;#222222;#abcdef"/);
  }
});

test('the wave opacity can be raised for the light-theme variant', () => {
  assert.equal((renderHeader(undefined, 'header', { opacity: 0.6 }).match(/opacity="0\.6"/g) || []).length, 2);
  assert.equal((renderFooter(undefined, { opacity: 0.6 }).match(/opacity="0\.6"/g) || []).length, 2);
});
