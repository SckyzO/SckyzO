'use strict';

const test = require('node:test');
const assert = require('node:assert');

const { normalizeHex, hexToRgb, validateRgb } = require('../src/color');

test('normalizeHex expands shorthand and lowercases', () => {
  assert.strictEqual(normalizeHex('#ABC'), '#aabbcc');
  assert.strictEqual(normalizeHex('#3B82F6'), '#3b82f6');
  assert.strictEqual(normalizeHex('3b82f6'), null);
  assert.strictEqual(normalizeHex('#12'), null);
  assert.strictEqual(normalizeHex(42), null);
});

test('hexToRgb converts to an "r, g, b" string', () => {
  assert.strictEqual(hexToRgb('#3b82f6'), '59, 130, 246');
  assert.strictEqual(hexToRgb('#fff'), '255, 255, 255');
  assert.strictEqual(hexToRgb('nope'), null);
});

test('validateRgb accepts valid triples and rejects the rest', () => {
  assert.strictEqual(validateRgb('59, 130, 246', 'X'), '59, 130, 246');
  assert.throws(() => validateRgb('300, 0, 0', 'X'), /0-255/);
  assert.throws(() => validateRgb('not-rgb', 'X'), /RGB string/);
});
