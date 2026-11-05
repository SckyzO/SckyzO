import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadConfig, DEFAULTS } from './config.js';

/** Writes a minimal-but-valid cards.config.json with `overrides` merged in, for testing loadConfig's merge behavior against a real file on disk. */
function withRawConfig(overrides) {
  const dir = mkdtempSync(join(tmpdir(), 'cards-config-'));
  const path = join(dir, 'cards.config.json');
  const raw = { username: 'test-user', ...overrides };
  writeFileSync(path, JSON.stringify(raw));
  return { path, cleanup: () => rmSync(dir, { recursive: true, force: true }) };
}

test('loads defaults from cards.config.json', () => {
  const c = loadConfig({});
  assert.equal(c.username, 'SckyzO');
  assert.ok(c.readme.projects.length > 0, 'the profile curates its notable projects');
});

test('env overrides username', () => {
  const c = loadConfig({ CARDS_USERNAME: 'octocat' });
  assert.equal(c.username, 'octocat');
});

test('languages.count defaults to 5 alongside existing excludeForks', () => {
  const c = loadConfig({});
  assert.equal(c.languages.count, 5);
  assert.equal(c.languages.excludeForks, true);
});

test('languages.excludeArchived defaults to false and is overridable', () => {
  const unset = withRawConfig({});
  const set = withRawConfig({ languages: { excludeArchived: true } });
  try {
    assert.equal(loadConfig({}, unset.path).languages.excludeArchived, false);
    const c = loadConfig({}, set.path);
    assert.equal(c.languages.excludeArchived, true);
    assert.equal(c.languages.excludeForks, true); // sibling default survives the partial override
  } finally {
    unset.cleanup();
    set.cleanup();
  }
});

test('readme block: defaults, override and validation', () => {
  const unset = withRawConfig({});
  const set = withRawConfig({ readme: { projects: ['a', 'b'], releasesCount: 3, releasesExclude: ['x'], languageEmoji: { Zig: '🟧' } } });
  const bad = withRawConfig({ readme: { projects: 'a' } });
  const badCount = withRawConfig({ readme: { releasesCount: 0 } });
  try {
    assert.deepEqual(loadConfig({}, unset.path).readme, DEFAULTS.readme);
    const c = loadConfig({}, set.path).readme;
    assert.deepEqual(c.projects, ['a', 'b']);
    assert.equal(c.releasesCount, 3);
    assert.deepEqual(c.releasesExclude, ['x']);
    assert.equal(c.languageEmoji.Zig, '🟧');
    assert.equal(c.languageEmoji.Go, DEFAULTS.readme.languageEmoji.Go); // emoji map merges over the defaults
    assert.throws(() => loadConfig({}, bad.path), /readme\.projects/);
    assert.throws(() => loadConfig({}, badCount.path), /readme\.releasesCount/);
  } finally {
    for (const t of [unset, set, bad, badCount]) t.cleanup();
  }
});

test('a raw config with only a username falls back to every default', () => {
  const t = withRawConfig({});
  try {
    const c = loadConfig({}, t.path);
    assert.deepEqual(c.fetch, DEFAULTS.fetch);
    assert.deepEqual(c.languages, DEFAULTS.languages);
    assert.deepEqual(c.capsule, DEFAULTS.capsule);
  } finally {
    t.cleanup();
  }
});

test('keys of the removed SVG cards are rejected, not silently ignored', () => {
  const t = withRawConfig({ cards: ['stats'], theme: 'tokyonight' });
  try {
    assert.throws(() => loadConfig({}, t.path), /cards, theme belonged to the removed SVG cards/);
  } finally {
    t.cleanup();
  }
});

test('readme.contributionsCount is rejected now that the contributions section is gone', () => {
  const t = withRawConfig({ readme: { contributionsCount: 5 } });
  try {
    assert.throws(() => loadConfig({}, t.path), /readme\.contributionsCount belonged to a removed README section/);
  } finally {
    t.cleanup();
  }
});

test('readme.stack and readme.terminal are validated', () => {
  const cases = [
    [{ stack: [{ color: '#000000' }] }, /readme\.stack\[0\]\.label is required/],
    [{ stack: [{ label: 'Go', color: 'blue' }] }, /readme\.stack\[0\]\.color must be a #rrggbb colour/],
    [{ stack: [{ label: 'Go', color: '#00ADD8', textColor: '#fff' }] }, /readme\.stack\[0\]\.textColor/],
    [{ stack: [{ label: 'Go', color: '#00ADD8', icon: '../go' }] }, /readme\.stack\[0\]\.icon must be an icon file name/],
    [{ terminal: { lines: 'hi' } }, /readme\.terminal\.lines/],
    [{ setup: [{ label: 'Vim', color: '#019733' }] }, /readme\.setup\[0\]\.icon/],
    [{ setup: [{ label: 'Vim', color: '#019733', icon: 'vim', url: 'javascript:alert(1)' }] }, /readme\.setup\[0\]\.url must be an https:\/\/ link/],
    [{ setup: [{ label: 'Vim', color: 'green', icon: 'vim' }] }, /readme\.setup\[0\]\.color/],
    [{ terminal: { prompt: '' } }, /readme\.terminal\.prompt/],
  ];
  for (const [readme, error] of cases) {
    const t = withRawConfig({ readme });
    try {
      assert.throws(() => loadConfig({}, t.path), error);
    } finally {
      t.cleanup();
    }
  }
  const ok = withRawConfig({ readme: { stack: [{ label: 'Go', color: '#00ADD8', icon: 'go' }], terminal: { lines: ['a'] } } });
  try {
    const r = loadConfig({}, ok.path).readme;
    assert.equal(r.terminal.prompt, DEFAULTS.readme.terminal.prompt, 'terminal merges over its defaults');
    assert.deepEqual(r.terminal.lines, ['a']);
  } finally {
    ok.cleanup();
  }
});

test('the committed cards.config.json loads', () => {
  const c = loadConfig({});
  assert.ok(c.readme.stack.length > 0);
  assert.ok(c.readme.terminal.lines.length > 0);
});

test('capsule.gradients must be hex palettes of equal length', () => {
  for (const [gradients, error] of [
    [[], /non-empty/],
    [[['red']], /#rrggbb/],
    [[['#111111', '#222222'], ['#333333']], /same number of colours/],
  ]) {
    const t = withRawConfig({ capsule: { gradients } });
    try {
      assert.throws(() => loadConfig({}, t.path), error);
    } finally {
      t.cleanup();
    }
  }
});
