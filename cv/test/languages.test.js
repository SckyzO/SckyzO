'use strict';

const test = require('node:test');
const assert = require('node:assert');

const { generateHTML } = require('../src/templates');
const data = require('../data/data.json');

// The language bar width used to be inferred from the language name
// (`name.includes('rançais') ? 100% : 75%`). It must come from an explicit
// numeric `percent` field instead.

test('language bar width is driven by percent, not the language name', () => {
  const d = structuredClone(data);
  d.languages.fr = [{ name: 'Klingon', level: 'Fluent', percent: 90 }];
  d.languages.en = [{ name: 'Klingon', level: 'Fluent', percent: 90 }];
  const html = generateHTML(d, 'fr', null, '', 'interactive', '');
  assert.ok(html.includes('width: 90%'), 'bar width must reflect percent (90%)');
  assert.ok(!html.includes('width: 75%'), 'must not fall back to the name-based 75%');
});

test('real data languages still render their configured widths', () => {
  const html = generateHTML(data, 'fr', null, '', 'interactive', '');
  for (const lng of data.languages.fr) {
    assert.strictEqual(typeof lng.percent, 'number', `${lng.name} must have a numeric percent`);
    assert.ok(html.includes(`width: ${lng.percent}%`), `bar for ${lng.name} must render`);
  }
});
