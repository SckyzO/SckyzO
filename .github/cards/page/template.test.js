import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { renderPage } from './template.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const fx = JSON.parse(readFileSync(join(HERE, '../fixtures/sample.json'), 'utf8'));
const data = { ...fx, page: { tagline: 'T', typingLines: ['A', 'B'], readmeUrl: '../' } };

// All element hooks app.js reads (per .github/cards/page/app.js).
const ALL_HOOKS = [
  'aboutList', 'activityGraph', 'calGrid', 'calMonths', 'donut', 'feed', 'gauge', 'langLegend',
  'repoBody', 'repoSearch', 'repoSort', 'repoToggle', 'stackChips', 'statRows',
  'streakRow', 'themeBtn', 'themeLbl', 'tip', 'toolChips', 'trophies',
];

test('renderPage inlines css/js and a valid data blob, with every card hook', () => {
  const html = renderPage(data, { css: '.card{}', js: 'console.log(1)' });
  assert.match(html, /<style>\.card\{\}<\/style>/);
  assert.match(html, /console\.log\(1\)/);
  const m = html.match(/<script id="cards-data" type="application\/json">([\s\S]*?)<\/script>/);
  assert.ok(m, 'data blob present');
  assert.doesNotThrow(() => JSON.parse(m[1]));
  for (const id of ['aboutList', 'calGrid', 'activityGraph', 'repoBody', 'donut', 'themeBtn'])
    assert.ok(html.includes(`id="${id}"`), `missing #${id}`);
  assert.match(html, /readme-typing-svg/); // typing image in header
  assert.match(html, /<animate /); // animated capsule
});

test('snake card embeds the real snake.svg artifact, not a JS-illustrative grid', () => {
  const html = renderPage(data, { css: '', js: '' });
  assert.match(html, /<img src="snake\.svg" alt="Contribution snake"/);
  assert.doesNotMatch(html, /id="snakeGrid"/);
});

test('renderPage is a complete standalone HTML document', () => {
  const html = renderPage(data, { css: '', js: '' });
  assert.match(html, /^<!doctype html>/i);
  assert.match(html, /<html lang="en">/);
  assert.match(html, /<meta charset="utf-8">/);
  assert.match(html, /<meta name="viewport" content="width=device-width, initial-scale=1">/);
  assert.match(html, /<title>[^<]+<\/title>/);
  assert.match(html, /<\/html>\s*$/);
});

test('renderPage emits every element hook app.js reads', () => {
  const html = renderPage(data, { css: '', js: '' });
  for (const id of ALL_HOOKS) assert.ok(html.includes(`id="${id}"`), `missing #${id}`);
});

test('stats/streak/repo containers have the exact structure app.js expects', () => {
  const html = renderPage(data, { css: '', js: '' });
  assert.match(html, /<div class="gauge" id="gauge"><\/div>/, '#gauge must be the empty .gauge div');
  assert.match(html, /<div class="stat-rows" id="statRows"><\/div>/, '#statRows must be an empty .stat-rows');
  assert.match(html, /<div class="streak-row" id="streakRow"><\/div>/, '#streakRow must be the empty .streak-row container');
  assert.match(html, /<span id="themeLbl">/, '#themeLbl must exist');
  assert.match(html, /<button class="toggle" id="themeBtn"[^>]*>[\s\S]*?<span id="themeLbl">[\s\S]*?<\/button>/, '#themeLbl must sit inside #themeBtn');

  assert.match(html, /<input id="repoSearch"/);
  assert.match(html, /<select id="repoSort">/);
  for (const v of ['stars', 'forks', 'updated', 'name'])
    assert.match(html, new RegExp(`<option value="${v}"`));
  assert.match(html, /<button id="repoToggle">/);
  assert.match(html, /<table class="repos">/);
  for (const s of ['name', 'language', 'stars', 'forks', 'updated'])
    assert.match(html, new RegExp(`<th[^>]*data-sort="${s}"`));
  assert.match(html, /<tbody id="repoBody"><\/tbody>/);
});

test('the #cards-data blob escapes </script> so untrusted string values cannot break out', () => {
  const evilData = {
    ...data,
    about: [{ icon: '👤', label: 'X', text: 'a</script><script>alert(1)</script>' }],
  };
  const html = renderPage(evilData, { css: '', js: '' });

  // No raw "</script>" may appear anywhere before the real closing tag of
  // the data-blob script element — otherwise the browser's HTML parser (or
  // this same regex) would treat the injected text as the tag closer.
  const m = html.match(/<script id="cards-data" type="application\/json">([\s\S]*?)<\/script>/);
  assert.ok(m, 'data blob present');
  assert.ok(!m[1].includes('</script>'), 'blob body must not contain a raw </script>');

  const parsed = JSON.parse(m[1]);
  assert.equal(parsed.about[0].text, 'a</script><script>alert(1)</script>');
});

test('typing image src is built from data.page.typingLines, URL-encoded and joined with ;', () => {
  const html = renderPage({ ...data, page: { ...data.page, typingLines: ['A B', 'C&D'] } }, { css: '', js: '' });
  assert.match(html, /https:\/\/readme-typing-svg\.demolab\.com\?[^"]*lines=A%20B;C%26D/);
  assert.doesNotMatch(html, /<span id="typing">/, 'must not use the mockup JS typing span');
});

test('back link points at data.page.readmeUrl', () => {
  const html = renderPage(data, { css: '', js: '' });
  assert.match(html, /<a class="back" href="\.\.\/">← Back to profile README<\/a>/);
});

test('theme.palette/font overrides are emitted after the base <style> block, overriding only configured tokens', () => {
  const themed = { ...data, theme: { palette: { title: '#abcdef' }, font: 'MyFont' } };
  const html = renderPage(themed, { css: ':root{--title:#70a5fd}', js: '' });
  const baseIdx = html.indexOf('<style>:root{--title:#70a5fd}</style>');
  assert.ok(baseIdx >= 0, 'base css block must be present, untouched');
  const overrideIdx = html.indexOf(':root{--title:#abcdef !important}', baseIdx + 1);
  assert.ok(overrideIdx > baseIdx, 'override :root must be placed after the base <style> block');
  assert.match(html.slice(overrideIdx), /body\{font-family:MyFont\}/, 'font override must follow the palette override');
});

test('palette override carries !important on the custom property so it also wins in light mode', () => {
  // styles.css's light-mode selectors (:root:not([data-theme="dark"]),
  // :root[data-theme="light"]) out-specificity a plain :root override;
  // !important on the custom property is specificity-agnostic and wins
  // regardless of theme.
  const html = renderPage({ ...data, theme: { palette: { title: '#abcdef' }, font: null } }, { css: '', js: '' });
  assert.match(html, /--title:\s*#abcdef\s*!important/);
});

test('theme.font is dropped when it fails the font-safe allowlist, preventing markup injection', () => {
  const evilFont = "'X'};</style><img src=x onerror=alert(1)>";
  const html = renderPage({ ...data, theme: { palette: {}, font: evilFont } }, { css: '', js: '' });
  assert.doesNotMatch(html, /<\/style><img/, 'unsafe font must not close the <style> block');
  assert.doesNotMatch(html, /<img src=x onerror=alert\(1\)>/, 'unsafe font must not inject markup');
});

test('no theme override block is emitted for the unconfigured (default) theme', () => {
  const html = renderPage({ ...data, theme: { palette: {}, font: null } }, { css: ':root{--title:#70a5fd}', js: '' });
  assert.equal((html.match(/<style>/g) || []).length, 1, 'only the base <style> block should be present');
  assert.match(html, /<style>:root\{--title:#70a5fd\}<\/style>/, 'base css must be unchanged');
});

test('theme override omitted entirely when data.theme is absent (back-compat with untouched callers)', () => {
  const html = renderPage(data, { css: ':root{--title:#70a5fd}', js: '' });
  assert.equal((html.match(/<style>/g) || []).length, 1);
});

test('palette values are guarded through the color allowlist to prevent CSS injection from a malformed config', () => {
  const evil = { ...data, theme: { palette: { title: '}body{background:url(evil)' }, font: null } };
  const html = renderPage(evil, { css: '', js: '' });
  // The unsafe value legitimately still appears in the inert JSON data blob
  // (it's JSON-encoded text there, not executable CSS) — the guard only
  // needs to keep it out of an actual <style> block.
  for (const styleBlock of html.matchAll(/<style>([\s\S]*?)<\/style>/g))
    assert.doesNotMatch(styleBlock[1], /url\(evil\)/, 'unsafe palette value must be dropped, not injected into a <style> block');
});
