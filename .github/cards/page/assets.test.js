import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const read = (f) => readFileSync(join(HERE, f), 'utf8');

test('styles.css defines the core card tokens', () => {
  const css = read('styles.css');
  assert.match(css, /\.card\s*\{/);
  assert.match(css, /--title:/);
  assert.match(css, /\[data-theme="light"\]/);
});

test('app.js is data-driven (no hardcoded sample data) and wires the hooks', () => {
  const js = read('app.js');
  assert.match(js, /getElementById\(["']cards-data["']\)/);
  assert.doesNotMatch(js, /prom-github-exporter/); // mockup sample data must be gone
  for (const id of ['calGrid', 'activityGraph', 'repoBody', 'themeBtn', 'donut'])
    assert.ok(js.includes(id), `app.js must reference #${id}`);
});

test('app.js escapes untrusted GitHub-sourced content before it reaches innerHTML', () => {
  const js = read('app.js');

  // The three defensive helpers must exist, with the right shape — checked
  // at the source level (no eval / new Function: the render is browser-only
  // and dynamically executing file content is itself the anti-pattern this
  // fix exists to avoid).
  assert.match(js, /function escapeHtml\(/, 'app.js must define escapeHtml()');
  assert.match(js, /function safeColor\(/, 'app.js must define safeColor()');
  assert.match(js, /function safeUrl\(/, 'app.js must define safeUrl()');

  const escapeHtmlSrc = js.match(/function escapeHtml\([\s\S]*?\n\}/)[0];
  for (const ch of ['&amp;', '&lt;', '&gt;', '&quot;', '&#39;'])
    assert.ok(escapeHtmlSrc.includes(ch), `escapeHtml must map to ${ch}`);

  const safeColorSrc = js.match(/function safeColor\([\s\S]*?\n\}/)[0];
  assert.match(safeColorSrc, /#\[0-9a-fA-F\]\{3,8\}/, 'safeColor must allowlist hex colors');
  assert.match(safeColorSrc, /#565f89/, 'safeColor must fall back to a safe default');

  const safeUrlSrc = js.match(/function safeUrl\([\s\S]*?\n\}/)[0];
  assert.match(safeUrlSrc, /https\?:\\?\/\\?\//, 'safeUrl must allowlist http(s)');
  assert.match(safeUrlSrc, /['"]#['"]/, 'safeUrl must fall back to "#" (blocks javascript: URLs)');

  // The untrusted sinks (activity feed, repo table, chips/donut colors) must
  // route through the helpers rather than interpolating DATA fields raw.
  const feedBlock = js.slice(js.indexOf("// Recent activity feed"), js.indexOf("// Languages donut"));
  assert.match(feedBlock, /escapeHtml\(e\.repo\)/, 'feed repo name must be escaped');
  assert.match(feedBlock, /escapeHtml\(e\.detail/, 'feed detail must be escaped');

  const repoBlock = js.slice(js.indexOf('// Repos:'));
  assert.match(repoBlock, /escapeHtml\(r\.name\)/, 'repo name must be escaped');
  assert.match(repoBlock, /escapeHtml\(r\.description\)/, 'repo description must be escaped');
  assert.match(repoBlock, /escapeHtml\(r\.language/, 'repo language must be escaped');
  assert.match(repoBlock, /safeColor\(r\.langColor\)/, 'repo lang dot color must be sanitized');
  assert.match(repoBlock, /safeUrl\(r\.url\)/, 'repo href must be sanitized');

  const chipBlock = js.slice(js.indexOf('// Stack / tools chips'), js.indexOf('// Trophies'));
  assert.match(chipBlock, /safeColor\(c\.color\)/, 'chip background color must be sanitized');
  assert.match(chipBlock, /escapeHtml\(c\.label\)/, 'chip label must be escaped');

  const donutBlock = js.slice(js.indexOf('renderDonut'), js.indexOf('// Stats + streak'));
  assert.match(donutBlock, /safeColor\(l\.color\)/, 'donut/legend language colors must be sanitized');
  assert.match(donutBlock, /escapeHtml\(l\.name\)/, 'language name must be escaped');

  const repoUrlBlock = js.slice(js.indexOf('// Repos:'));
  assert.match(repoUrlBlock, /href="\$\{escapeHtml\(safeUrl\(r\.url\)\)\}"/,
    'repo href must be escapeHtml-wrapped around safeUrl as defense-in-depth');
});

test('donut center label is set from the top language (CSS reads it via attr(data-center))', () => {
  const js = read('app.js');
  const donutBlock = js.slice(js.indexOf('renderDonut'), js.indexOf('// Stats + streak'));
  assert.match(donutBlock, /donut\.dataset\.center\s*=/, 'renderDonut must set #donut\'s data-center');
});

test('renderCalendar places each day by its actual weekday, not its index in a possibly-partial week', () => {
  const js = read('app.js');
  const calBlock = js.slice(js.indexOf('renderCalendar'), js.indexOf('// Activity graph'));
  assert.match(calBlock, /Date\.UTC\(y, m - 1, d\)\)\.getUTCDay\(\)/,
    'row must be derived from a timezone-safe UTC weekday, not the day\'s array index');
});

test('repo search filter treats a null language as empty, not the literal string "null"', () => {
  const js = read('app.js');
  const repoBlock = js.slice(js.indexOf('// Repos:'));
  assert.match(repoBlock, /\$\{r\.language \|\| ''\}/, 'filter string must guard against r.language being null');
});
