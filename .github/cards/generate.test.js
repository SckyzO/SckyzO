import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { renderWaves, updateReadme } from './generate.mjs';

test('renderWaves gives header and footer the same gradient', () => {
  const { header, footer } = renderWaves([['#111111', '#222222'], ['#333333', '#444444']], 0);
  for (const svg of [header, footer]) {
    assert.match(svg, /stop-color="#111111"/);
    assert.doesNotMatch(svg, /#333333/);
  }
});

test('updateReadme injects generated sections into the README file in place', () => {
  const dir = mkdtempSync(join(tmpdir(), 'cards-readme-'));
  const path = join(dir, 'README.md');
  const names = ['stats', 'languages', 'projects', 'contributions', 'releases'];
  writeFileSync(path, ['# Hi', ...names.map((n) => `<!-- cards:${n}:start -->\nstale\n<!-- cards:${n}:end -->`)].join('\n'));
  try {
    const changed = updateReadme(path, {
      profile: { repoCount: 2, years: 3 }, stats: { stars: 4, contributions: 5 },
      languages: [{ name: 'Go', pct: 100 }], projects: [], contributions: [], releases: [],
    }, {});
    const out = readFileSync(path, 'utf8');
    assert.equal(changed, true);
    assert.ok(out.startsWith('# Hi\n'), 'hand-written content is preserved');
    assert.doesNotMatch(out, /stale/);
    assert.match(out, /📦 \*\*2\*\*/u);
    assert.match(out, /🔥 \*\*5\*\*/u);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
