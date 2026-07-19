import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { buildPageData } from './generate-page.mjs';
import { DEFAULTS } from '../config.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const fx = JSON.parse(readFileSync(join(HERE, '../fixtures/sample.json'), 'utf8'));
const basePage = { tagline: 'T', typingLines: ['A'], readmeUrl: '../' };

test('buildPageData merges static config into the api data and adds a page block', () => {
  const cfg = { about: [{ icon: '👤', label: 'X', text: 'y' }], stack: [{ label: 'Go', color: '#00ADD8' }], tools: [],
    page: { tagline: 'T', typingLines: ['A'], readmeUrl: '../' } };
  const out = buildPageData({ ...fx, about: undefined, stack: undefined, tools: undefined }, cfg);
  assert.deepEqual(out.about, cfg.about);
  assert.equal(out.stack[0].label, 'Go');
  assert.equal(out.page.tagline, 'T');
  assert.ok(Array.isArray(out.repoList));
  assert.ok(!('dashboardUrl' in out.page), 'dashboardUrl is dead data and must not be plumbed through');
});

test('buildPageData reduces cfg.theme.palette to only the keys that differ from the defaults', () => {
  const cfg = { about: [], stack: [], tools: [], page: basePage,
    theme: { name: 'tokyonight', palette: { ...DEFAULTS.theme.palette, title: '#abcdef' }, font: DEFAULTS.theme.font } };
  const out = buildPageData(fx, cfg);
  assert.deepEqual(out.theme.palette, { title: '#abcdef' });
  assert.equal(out.theme.font, null);
});

test('buildPageData yields an empty palette diff and a null font for the unconfigured (default) theme', () => {
  const cfg = { about: [], stack: [], tools: [], page: basePage,
    theme: { name: 'tokyonight', palette: { ...DEFAULTS.theme.palette }, font: DEFAULTS.theme.font } };
  const out = buildPageData(fx, cfg);
  assert.deepEqual(out.theme.palette, {});
  assert.equal(out.theme.font, null);
});
