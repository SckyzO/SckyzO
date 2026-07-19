import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { buildPageData } from './generate-page.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const fx = JSON.parse(readFileSync(join(HERE, '../fixtures/sample.json'), 'utf8'));

test('buildPageData merges static config into the api data and adds a page block', () => {
  const cfg = { about: [{ icon: '👤', label: 'X', text: 'y' }], stack: [{ label: 'Go', color: '#00ADD8' }], tools: [],
    page: { tagline: 'T', typingLines: ['A'], readmeUrl: '../', dashboardUrl: 'cards/' } };
  const out = buildPageData({ ...fx, about: undefined, stack: undefined, tools: undefined }, cfg);
  assert.deepEqual(out.about, cfg.about);
  assert.equal(out.stack[0].label, 'Go');
  assert.equal(out.page.tagline, 'T');
  assert.ok(Array.isArray(out.repoList));
});
