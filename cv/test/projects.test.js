'use strict';

const test = require('node:test');
const assert = require('node:assert');

const { generateHTML, generateMarkdown, generatePlain } = require('../src/templates');
const data = require('../data/data.json');

// data.projects were validated but never rendered anywhere. They must appear in
// the interactive HTML, the Markdown and the plain-text outputs.

test('generateMarkdown includes every project with name, description, tools and link', () => {
  const md = generateMarkdown(data, 'fr');
  for (const p of data.projects) {
    assert.ok(md.includes(p.name), `Markdown must include project "${p.name}"`);
    assert.ok(md.includes(p.description.fr), `Markdown must include the FR description of "${p.name}"`);
    assert.ok(md.includes(`github.com/${p.github}`), `Markdown must link to ${p.github}`);
    for (const tool of p.tools) {
      assert.ok(md.includes(tool), `Markdown must list tool "${tool}"`);
    }
  }
});

test('generatePlain includes every project with name, description and tools', () => {
  const txt = generatePlain(data, 'en');
  for (const p of data.projects) {
    assert.ok(txt.includes(p.name), `Plain text must include project "${p.name}"`);
    assert.ok(txt.includes(p.description.en), `Plain text must include the EN description of "${p.name}"`);
    for (const tool of p.tools) {
      assert.ok(txt.includes(tool), `Plain text must list tool "${tool}"`);
    }
  }
});

test('generateHTML (interactive) renders every project', () => {
  const html = generateHTML(data, 'fr', null, '', 'interactive', '');
  for (const p of data.projects) {
    assert.ok(html.includes(p.name), `Interactive HTML must render project "${p.name}"`);
    assert.ok(html.includes(`github.com/${p.github}`), `Interactive HTML must link to ${p.github}`);
  }
});
