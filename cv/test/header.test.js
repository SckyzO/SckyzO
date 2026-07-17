'use strict';

const test = require('node:test');
const assert = require('node:assert');

const { generateHTML } = require('../src/templates');
const { i18n } = require('../src/i18n');
const data = require('../data/data.json');

// Bug: the verso header cog button used the page-language aria-label (t1)
// instead of the other language (t2), so the flipped side was mislabeled.

test('activity.repo (external GitHub API data) is HTML-escaped in the header', () => {
  const html = generateHTML(data, 'fr', { repo: 'a<b>&"x', date: null, public_repos: 1 }, '', 'interactive', '');
  assert.ok(!html.includes('a<b>&"x'), 'raw repo string must never appear unescaped');
  assert.ok(html.includes('a&lt;b&gt;'), 'repo must be HTML-escaped where shown as text');
});

test('header recto/verso cog buttons carry their own language aria-label', () => {
  const fr = generateHTML(data, 'fr', null, '', 'interactive', '');
  const recto = fr.match(/id="main-cog-mobile"[^>]*aria-label="([^"]*)"/);
  const verso = fr.match(/id="main-cog-mobile-en"[^>]*aria-label="([^"]*)"/);
  assert.ok(recto && verso, 'both cog buttons must be present');
  assert.strictEqual(recto[1], i18n.fr.settingsOpenAria, 'recto (FR page) aria must be French');
  assert.strictEqual(verso[1], i18n.en.settingsOpenAria, 'verso aria must be the other language');
});
