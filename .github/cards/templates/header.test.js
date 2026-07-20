import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderHeader, renderFooter, pickGradient } from './header.mjs';

test('renderHeader draws an 854-wide gradient wave', () => {
  const svg = renderHeader({});
  assert.match(svg, /<path/);
  assert.match(svg, /linearGradient/);
  assert.match(svg, /viewBox="0 0 854 100"/);
});

test('renderFooter is not the flipped-header markup verbatim (transform differs)', () => {
  const header = renderHeader({});
  const footer = renderFooter({});
  assert.match(header, /transform="scale \(-1, 1\)"/, 'header flips horizontally');
  assert.doesNotMatch(footer, /transform=/, 'footer carries no transform');
});

test('header and footer capsules each animate two superposed, out-of-phase paths', () => {
  for (const [name, svg] of [['header', renderHeader({})], ['footer', renderFooter({})]]) {
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

test('pickGradient is deterministic for a given timestamp', () => {
  const gradients = [['#111'], ['#222'], ['#333']];
  const now = Date.parse('2026-01-01T00:00:00Z');
  assert.deepEqual(pickGradient(gradients, now), pickGradient(gradients, now));
});

test('pickGradient cycles through the list as time advances', () => {
  const gradients = [['#111'], ['#222'], ['#333']];
  const base = Date.parse('2026-01-01T00:00:00Z');
  const HOUR_MS = 3.6e6;
  const picks = new Set();
  for (let i = 0; i < gradients.length; i++) picks.add(JSON.stringify(pickGradient(gradients, base + i * HOUR_MS)));
  assert.equal(picks.size, gradients.length, 'consecutive hourly picks cover the whole list');
});

test('renderHeader/renderFooter thread the chosen gradient stops into the SVG', () => {
  const stops = ['#abcdef', '#123456'];
  const header = renderHeader({}, undefined, 'header', stops);
  const footer = renderFooter({}, undefined, stops);
  for (const svg of [header, footer]) {
    assert.match(svg, /#abcdef/);
    assert.match(svg, /#123456/);
  }
});
