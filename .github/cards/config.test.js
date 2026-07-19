import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadConfig, KNOWN_CARDS, DEFAULTS, normalizeTheme } from './config.js';

/** Writes a minimal-but-valid cards.config.json with `overrides` merged in, for testing loadConfig's merge behavior against a real file on disk. */
function withRawConfig(overrides) {
  const dir = mkdtempSync(join(tmpdir(), 'cards-config-'));
  const path = join(dir, 'cards.config.json');
  const raw = { username: 'test-user', cards: ['stats'], ...overrides };
  writeFileSync(path, JSON.stringify(raw));
  return { path, cleanup: () => rmSync(dir, { recursive: true, force: true }) };
}

test('loads defaults from cards.config.json', () => {
  const c = loadConfig({});
  assert.equal(c.username, 'SckyzO');
  assert.equal(c.theme.name, 'tokyonight');
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

test('page block has no dashboardUrl — dead data, unconsumed by template/app', () => {
  const c = loadConfig({});
  assert.ok(!('dashboardUrl' in c.page), 'cards.config.json / config.js default must not carry dashboardUrl');
});

test('grade defaults present when cards.config.json omits the block', () => {
  const c = loadConfig({});
  assert.deepEqual(c.grade.weights, { commits: 1, prs: 5, issues: 3, stars: 4, contributedTo: 6 });
  assert.deepEqual(c.grade.thresholds, { S: 8000, 'A+': 5000, A: 2500, B: 1000 });
});

test('trophies default to the canonical 6-entry array', () => {
  const c = loadConfig({});
  assert.equal(c.trophies.length, 6);
  assert.equal(c.trophies[0].kind, 'Stars');
  assert.equal(c.trophies[1].metric, 'grade');
});

test('theme defaults to the tokyonight palette and font as an object', () => {
  const c = loadConfig({});
  assert.equal(c.theme.name, 'tokyonight');
  assert.equal(c.theme.palette.bg, '#1a1b27');
  assert.equal(c.theme.palette.white, '#ffffff');
  assert.equal(c.theme.font, "'Segoe UI',Ubuntu,'Helvetica Neue',Sans-Serif");
});

test('fetch and activityGraph defaults present when omitted', () => {
  const c = loadConfig({});
  assert.equal(c.fetch.repoScanLimit, 100);
  assert.equal(c.fetch.eventsPerPage, 30);
  assert.equal(c.activityGraph.days, 30);
});

test('languages.count defaults to 5 alongside existing excludeForks', () => {
  const c = loadConfig({});
  assert.equal(c.languages.count, 5);
  assert.equal(c.languages.excludeForks, true);
});

test('normalizeTheme: string form normalizes to {name, palette, font} using defaults', () => {
  const t = normalizeTheme('tokyonight');
  assert.deepEqual(t, { name: 'tokyonight', palette: DEFAULTS.theme.palette, font: DEFAULTS.theme.font });
});

test('normalizeTheme: a different string name still gets the default palette/font', () => {
  const t = normalizeTheme('midnight');
  assert.equal(t.name, 'midnight');
  assert.deepEqual(t.palette, DEFAULTS.theme.palette);
  assert.equal(t.font, DEFAULTS.theme.font);
});

test('normalizeTheme: undefined normalizes to full defaults', () => {
  const t = normalizeTheme(undefined);
  assert.deepEqual(t, { name: 'tokyonight', palette: DEFAULTS.theme.palette, font: DEFAULTS.theme.font });
});

test('normalizeTheme: object form merges partial palette/font over defaults', () => {
  const t = normalizeTheme({ name: 'custom', palette: { bg: '#000000' }, font: 'Comic Sans' });
  assert.equal(t.name, 'custom');
  assert.equal(t.palette.bg, '#000000');
  assert.equal(t.palette.ink, DEFAULTS.theme.palette.ink, 'unset palette keys fall back to defaults');
  assert.equal(t.font, 'Comic Sans');
});

test('partial grade override merges: raw grade:{thresholds:{S:9000}} keeps weights and thresholds.A at defaults', () => {
  const { path, cleanup } = withRawConfig({ grade: { thresholds: { S: 9000 } } });
  try {
    const c = loadConfig({}, path);
    assert.equal(c.grade.thresholds.S, 9000, 'override wins');
    assert.equal(c.grade.thresholds.A, DEFAULTS.grade.thresholds.A, 'unset threshold falls back to default');
    assert.deepEqual(c.grade.weights, DEFAULTS.grade.weights, 'untouched block stays fully default');
  } finally {
    cleanup();
  }
});

test('raw config with no grade/theme/fetch/activityGraph/trophies blocks falls back to full defaults', () => {
  const { path, cleanup } = withRawConfig({});
  try {
    const c = loadConfig({}, path);
    assert.deepEqual(c.grade, DEFAULTS.grade);
    assert.deepEqual(c.fetch, DEFAULTS.fetch);
    assert.deepEqual(c.activityGraph, DEFAULTS.activityGraph);
    assert.deepEqual(c.trophies, DEFAULTS.trophies);
    assert.equal(c.languages.count, 5);
  } finally {
    cleanup();
  }
});

test('raw trophies array, when provided, replaces the default wholesale (not merged)', () => {
  const { path, cleanup } = withRawConfig({ trophies: [{ kind: 'Custom', metric: 'stars', tiers: [{ min: 0, rank: 'A' }] }] });
  try {
    const c = loadConfig({}, path);
    assert.equal(c.trophies.length, 1);
    assert.equal(c.trophies[0].kind, 'Custom');
  } finally {
    cleanup();
  }
});
