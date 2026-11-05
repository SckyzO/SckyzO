import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cycleFrom, pickGradient, gradientDef, SECONDS_PER_PALETTE } from './gradient.mjs';

const HOUR_MS = 3.6e6;
const gradients = [['#111111', '#aaaaaa'], ['#222222', '#bbbbbb'], ['#333333', '#cccccc']];

test('cycleFrom keeps every palette and starts at the palette of the hour', () => {
  const base = Date.parse('2026-01-01T00:00:00Z');
  const starts = new Set();
  for (let i = 0; i < gradients.length; i++) {
    const cycle = cycleFrom(gradients, base + i * HOUR_MS);
    assert.deepEqual([...cycle].sort(), [...gradients].sort(), 'rotation only, nothing dropped');
    starts.add(cycle[0][0]);
  }
  assert.equal(starts.size, gradients.length, 'consecutive hours open on different palettes');
  assert.deepEqual(cycleFrom(gradients, base), cycleFrom(gradients, base), 'deterministic');
  assert.deepEqual(pickGradient(gradients, base), cycleFrom(gradients, base)[0]);
});

test('gradientDef animates each stop through the cycle and loops back', () => {
  const svg = gradientDef('g', gradients);
  const anims = [...svg.matchAll(/<stop offset="(\d+)%" stop-color="([^"]+)"><animate attributeName="stop-color" dur="(\d+)s" repeatCount="indefinite" values="([^"]+)"\/><\/stop>/g)];
  assert.equal(anims.length, 2);
  assert.deepEqual(anims.map((a) => a[1]), ['0', '100']);
  assert.equal(anims[0][2], '#111111', 'static colour = first palette');
  assert.equal(anims[0][4], '#111111;#222222;#333333;#111111');
  assert.equal(anims[1][4], '#aaaaaa;#bbbbbb;#cccccc;#aaaaaa');
  assert.equal(Number(anims[0][3]), gradients.length * SECONDS_PER_PALETTE);
});

test('gradientDef with a single palette is static', () => {
  assert.doesNotMatch(gradientDef('g', [['#111111', '#222222']]), /<animate/);
});
