import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const fx = JSON.parse(readFileSync(join(HERE, '../fixtures/sample.json'), 'utf8'));

test('fixture carries calendar weeks and a repo list for the dashboard', () => {
  assert.ok(Array.isArray(fx.contributionWeeks) && fx.contributionWeeks.length >= 4);
  assert.ok('date' in fx.contributionWeeks[0][0] && 'count' in fx.contributionWeeks[0][0]);
  assert.ok(Array.isArray(fx.repoList) && fx.repoList.length >= 8);
  for (const k of ['name', 'description', 'language', 'langColor', 'stars', 'forks', 'updatedAt', 'url'])
    assert.ok(k in fx.repoList[0], `repoList entry missing ${k}`);
});
