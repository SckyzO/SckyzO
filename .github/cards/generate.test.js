import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { renderWaves, renderAssets, updateReadme } from './generate.mjs';
import { DEFAULTS } from './config.js';

test('renderWaves gives header and footer the same gradient, in a light and a dark variant', () => {
  const waves = renderWaves([['#111111', '#222222'], ['#333333', '#444444']], 0);
  assert.deepEqual(Object.keys(waves).sort(), ['footer-dark.svg', 'footer-light.svg', 'header-dark.svg', 'header-light.svg']);
  assert.match(waves['header-dark.svg'], /opacity="0\.4"/);
  assert.match(waves['header-light.svg'], /opacity="0\.6"/);
  for (const svg of Object.values(waves)) {
    assert.match(svg, /stop-color="#111111"/);
    assert.doesNotMatch(svg, /#333333/);
  }
});

test('updateReadme injects generated sections into the README file in place', () => {
  const dir = mkdtempSync(join(tmpdir(), 'cards-readme-'));
  const path = join(dir, 'README.md');
  const names = ['stack', 'setup', 'stats', 'languages', 'projects', 'releases'];
  writeFileSync(path, ['# Hi', ...names.map((n) => `<!-- cards:${n}:start -->\nstale\n<!-- cards:${n}:end -->`)].join('\n'));
  try {
    const changed = updateReadme(path, {
      profile: { repoCount: 2, years: 3 }, stats: { stars: 4, followers: 5 },
      languages: [{ name: 'Go', pct: 100 }], projects: [], releases: [],
    }, { languageEmoji: {}, stack: [{ label: 'Go', color: '#00ADD8' }] });
    const out = readFileSync(path, 'utf8');
    assert.equal(changed, true);
    assert.ok(out.startsWith('# Hi\n'), 'hand-written content is preserved');
    assert.doesNotMatch(out, /stale/);
    assert.match(out, /📦 \*\*2\*\*/u);
    assert.match(out, /👥 \*\*5\*\*/u);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('renderAssets produces every image the README references', () => {
  const cfg = { capsule: DEFAULTS.capsule, readme: { ...DEFAULTS.readme,
    stack: [{ label: 'Go', color: '#00ADD8', icon: 'go' }, { label: 'Slurm', color: '#2C6E49' }],
    setup: [{ label: 'Zsh', color: '#F15A24', icon: 'zsh' }],
    terminal: { prompt: 'tom@hpc:~$', command: 'whoami', lines: ['Systems & HPC Engineer'] } } };
  const data = { stats: { followers: 16 }, languages: [{ name: 'Go', pct: 100 }] };
  const asked = [];
  const readIcon = (name) => { asked.push(name); return '<svg viewBox="0 0 24 24"><path fill="#00ADD8" d="M1 1h2"/></svg>'; };
  const assets = renderAssets(cfg, data, { now: 0, readIcon });
  assert.deepEqual(Object.keys(assets).sort(), [
    'badges/followers.svg', 'badges/go.svg', 'badges/slurm.svg', 'divider.svg',
    'footer-dark.svg', 'footer-light.svg', 'header-dark.svg', 'header-light.svg', 'keys/zsh.svg', 'languages.svg', 'terminal.svg',
  ]);
  assert.deepEqual(asked, ['go', 'lucide/zsh'], 'stack badges without an icon read no file; setup keys read their Lucide icon');
  assert.match(assets['keys/zsh.svg'], /stroke="#F15A24"/);
  assert.match(assets['badges/go.svg'], /<path d="M1 1h2"\/>/);
  assert.match(assets['badges/followers.svg'], />16</);
  assert.match(assets['terminal.svg'], /Systems &amp; HPC Engineer/);
});

test('renderAssets skips the terminal when no line is configured', () => {
  const cfg = { capsule: DEFAULTS.capsule, readme: DEFAULTS.readme };
  const assets = renderAssets(cfg, { stats: { followers: 0 }, languages: [] }, { now: 0, readIcon: () => '' });
  assert.ok(!('terminal.svg' in assets));
});
