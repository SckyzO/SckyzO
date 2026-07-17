'use strict';

const test = require('node:test');
const assert = require('node:assert');

const { generateHtaccess, generateRobotsTxt } = require('../src/artifacts');

// --- Bug #3: the .htaccess FilesMatch regex was double-escaped, so the
// X-Robots-Tag noindex header never matched a real .pdf/.md/.txt file. ---

test('htaccess FilesMatch pattern matches downloadable files', () => {
  const htaccess = generateHtaccess();
  const match = htaccess.match(/<FilesMatch "([^"]+)">/);
  assert.ok(match, 'a FilesMatch directive must be present');

  // Interpret the pattern exactly as it is written in the generated file.
  const pattern = new RegExp(match[1]);
  assert.ok(pattern.test('CV_Thomas_Bourcey_FR.pdf'), 'must match a .pdf file');
  assert.ok(pattern.test('Resume_EN.md'), 'must match a .md file');
  assert.ok(pattern.test('cv.txt'), 'must match a .txt file');
  assert.ok(!pattern.test('index.html'), 'must not match unrelated extensions');
});

test('htaccess forces HTTPS redirection', () => {
  const htaccess = generateHtaccess();
  assert.ok(htaccess.includes('RewriteCond %{HTTPS} off'));
  assert.ok(htaccess.includes('[L,R=301]'));
});

test('robots.txt disallows downloadable files in both cases', () => {
  const robots = generateRobotsTxt();
  assert.ok(robots.startsWith('User-agent: *'));
  assert.ok(robots.includes('Disallow: /*.pdf$'));
  assert.ok(robots.includes('Disallow: /*.PDF$'));
});
