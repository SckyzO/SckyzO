'use strict';

const test = require('node:test');
const assert = require('node:assert');

const { generateHTML, generateMarkdown, generatePlain } = require('../src/templates');
const data = require('../data/data.json');

// --- Bug #1: certifications rendered as "[object Object]" in MD/TXT ---
// certifications[] are objects { name, issuer, year, icon }. They must be
// formatted, never interpolated directly.

test('generateMarkdown renders certifications by name, not [object Object]', () => {
  const md = generateMarkdown(data, 'fr');
  assert.ok(!md.includes('[object Object]'), 'Markdown must not contain "[object Object]"');
  const first = data.certifications[0];
  assert.ok(md.includes(first.name), `Markdown must include certification name "${first.name}"`);
});

test('generatePlain renders certifications by name, not [object Object]', () => {
  const txt = generatePlain(data, 'en');
  assert.ok(!txt.includes('[object Object]'), 'Plain text must not contain "[object Object]"');
  const first = data.certifications[0];
  assert.ok(txt.includes(first.name), `Plain text must include certification name "${first.name}"`);
});

// --- Bug #2: activity.repo may be null when the latest public event is not a
// PushEvent. The header must not render the literal "null" nor a broken link. ---

test('generateHTML omits the focus badge when activity.repo is null', () => {
  const activity = { repo: null, date: null, public_repos: 42 };
  const html = generateHTML(data, 'fr', activity, '', 'pdf');
  assert.ok(
    !html.includes(`${data.contact.github}/null`),
    'Header must not build a link to a "null" repository'
  );
  assert.ok(
    !html.includes('>null<') && !html.includes(': </span>null'),
    'Header must not print the literal string "null"'
  );
});

test('generateHTML still uses public_repos count when activity.repo is null', () => {
  const activity = { repo: null, date: null, public_repos: 42 };
  const html = generateHTML(data, 'fr', activity, '', 'pdf');
  assert.ok(html.includes('>42<'), 'Public repos metric must still be rendered');
});

// --- Bug (found via lint): the requested PDF font stack was computed but never
// applied — the <body> class was hardcoded to "font-architect". ---

const bodyClasses = (html) => html.match(/<body class="([^"]*)"/)[1].split(/\s+/);

test('generateHTML applies the requested PDF font stack to the body', () => {
  const html = generateHTML(data, 'fr', null, '', 'pdf', '', { fontStack: 'hub' });
  const classes = bodyClasses(html);
  assert.ok(classes.includes('font-hub'), 'body must carry the requested font stack class');
  assert.ok(!classes.includes('font-architect'), 'body must not fall back to font-architect');
});

test('generateHTML defaults to the architect font stack when none is requested', () => {
  const html = generateHTML(data, 'fr', null, '', 'pdf');
  assert.ok(bodyClasses(html).includes('font-architect'), 'default font stack must remain architect');
});
