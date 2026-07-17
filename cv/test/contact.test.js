'use strict';

const test = require('node:test');
const assert = require('node:assert');

const { generateHTML } = require('../src/templates');
const data = require('../data/data.json');

const ageLines = (html) =>
  [...html.matchAll(/>\s*(\d+ (?:ans|years old)) <span class="opacity-50/g)].map((m) => m[1]);

// Bug: the contact "age" line was hardcoded (French front / English back)
// regardless of the page language, so the EN page showed "41 ans".

test('contact age line follows the page language (EN page front is English)', () => {
  const en = generateHTML(data, 'en', null, '', 'interactive', '');
  const lines = ageLines(en);
  assert.ok(lines.length >= 1, 'an age line must be present');
  assert.ok(/years old/.test(lines[0]), `EN page front must read "years old", got "${lines[0]}"`);
});

test('contact age line follows the page language (FR page front is French)', () => {
  const fr = generateHTML(data, 'fr', null, '', 'interactive', '');
  const lines = ageLines(fr);
  assert.ok(lines.length >= 1, 'an age line must be present');
  assert.ok(/ ans$/.test(lines[0]), `FR page front must read "ans", got "${lines[0]}"`);
});
