import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadConfig, KNOWN_CARDS } from './config.js';

test('loads defaults from cards.config.json', () => {
  const c = loadConfig({});
  assert.equal(c.username, 'SckyzO');
  assert.equal(c.theme, 'tokyonight');
  assert.ok(Array.isArray(c.cards) && c.cards.length > 0);
});

test('env overrides username', () => {
  const c = loadConfig({ CARDS_USERNAME: 'octocat' });
  assert.equal(c.username, 'octocat');
});

test('rejects unknown card names', () => {
  assert.throws(() => loadConfig({ CARDS_CARDS: 'stats,bogus' }), /unknown card/i);
});

test('KNOWN_CARDS covers all known cards', () => {
  for (const n of ['about','stack','tools','stats','streak','activity-graph','top-repos','activity','trophies','languages'])
    assert.ok(KNOWN_CARDS.includes(n));
});
