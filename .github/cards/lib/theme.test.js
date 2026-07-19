import { test } from 'node:test';
import assert from 'node:assert/strict';
import { tokyonight, escapeXml, svgFrame, text } from './theme.mjs';

test('palette has exact tokyonight values', () => {
  assert.equal(tokyonight.bg, '#1a1b27');
  assert.equal(tokyonight.title, '#70a5fd');
  assert.equal(tokyonight.flame, '#ff9e64');
});

test('escapeXml neutralises markup', () => {
  assert.equal(escapeXml('a<b>&"z'), 'a&lt;b&gt;&amp;&quot;z');
});

test('svgFrame is a standalone sized svg with the bg', () => {
  const s = svgFrame(400, 120, '<g/>');
  assert.match(s, /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" width="400" height="120"/);
  assert.match(s, /fill="#1a1b27"/);
  assert.match(s, /<\/svg>$/);
});

test('text escapes its content', () => {
  assert.match(text(10, 20, 'a<b', {}), /a&lt;b/);
});
