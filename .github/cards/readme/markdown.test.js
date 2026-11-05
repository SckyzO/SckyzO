import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  compactNumber, escapeHtml, renderStatsRow, renderLanguages,
  renderProjects, renderReleases, renderStack, injectSections, renderReadmeSections,
} from './markdown.mjs';

test('compactNumber keeps small numbers and abbreviates thousands', () => {
  assert.equal(compactNumber(196), '196');
  assert.equal(compactNumber(8600), '8.6k');
  assert.equal(compactNumber(12000), '12k');
});

test('escapeHtml neutralises markup coming from repo descriptions', () => {
  assert.equal(escapeHtml('<b>a & "b"</b>'), '&lt;b&gt;a &amp; &quot;b&quot;&lt;/b&gt;');
});

test('renderStatsRow renders a centred 4-column table with followers', () => {
  const md = renderStatsRow({ repoCount: 63, stars: 196, followers: 1600, years: 15 });
  assert.match(md, /<div align="center">/);
  assert.match(md, /\| 📦 \*\*63\*\* \| ⭐ \*\*196\*\* \| 👥 \*\*1\.6k\*\* \| 🗓️ \*\*15\*\* \|/u);
  assert.match(md, /\| Repositories \| Stars \| Followers \| Years on GitHub \|/);
  assert.match(md, /\|:-:\|:-:\|:-:\|:-:\|/);
});

test('renderLanguages puts a text legend under the decorative full-width bar', () => {
  const md = renderLanguages([{ name: 'Go', pct: 75 }, { name: 'Zig', pct: 25 }], { Go: '🟩' });
  assert.match(md, /^<img src="\.\/assets\/languages\.svg" alt="" width="100%" \/>/);
  assert.match(md, /<p align="center">🟩 <b>Go<\/b> 75 % · ⬛ <b>Zig<\/b> 25 %<\/p>/u); // unmapped language falls back to ⬛
  assert.equal(renderLanguages([], {}), '_No language data yet._');
});

test('renderProjects lays repos out two per row and escapes descriptions', () => {
  const md = renderProjects([
    { name: 'a', url: 'https://x/a', description: 'x < y', language: 'Go', stars: 3, forks: 1 },
    { name: 'b', url: 'https://x/b', description: '', language: null, stars: 0, forks: 0 },
    { name: 'c', url: 'https://x/c', description: 'c', language: 'Python', stars: 1, forks: 0 },
  ], { Go: '🟩' });
  assert.equal((md.match(/<tr>/g) || []).length, 2);
  assert.match(md, /<a href="https:\/\/x\/a"><b>a<\/b><\/a>/);
  assert.match(md, /x &lt; y/);
  assert.match(md, /<code>🟩 Go<\/code> <code>⭐ 3<\/code> <code>🍴 1<\/code>/u); // facts render as grey chips
  assert.doesNotMatch(md, /🍴 0/u); // zero forks is noise
  assert.match(md, /<td width="50%" valign="top"><\/td>/); // odd count: last row padded
  assert.equal((md.match(/<td width="50%" valign="top">/g) || []).length, 4); // cards of uneven height stay top-aligned
});

test('renderReleases renders a diff block with aligned columns', () => {
  const md = renderReleases([
    { repo: 'slurm_exporter', tag: 'v1.2.0', date: '2026-10-01T00:00:00Z' },
    { repo: 'cosmos', tag: 'v0.9.0', date: '2026-09-12T00:00:00Z' },
  ]);
  assert.equal(md, '```diff\n+ slurm_exporter  v1.2.0  2026-10-01\n+ cosmos          v0.9.0  2026-09-12\n```');
  assert.equal(renderReleases([]), '_No releases published yet._');
});

test('injectSections replaces only the content between markers', () => {
  const readme = 'top\n<!-- cards:stats:start -->\nold\n<!-- cards:stats:end -->\nbottom\n';
  assert.equal(injectSections(readme, { stats: 'new' }),
    'top\n<!-- cards:stats:start -->\nnew\n<!-- cards:stats:end -->\nbottom\n');
});

test('injectSections fails fast when a marker pair is missing', () => {
  assert.throws(() => injectSections('no markers', { stats: 'x' }), /cards:stats/);
});

test('injectSections does not interpret $ patterns in generated content', () => {
  const readme = '<!-- cards:x:start -->\n<!-- cards:x:end -->';
  assert.match(injectSections(readme, { x: "cost $& and $1" }), /cost \$& and \$1/);
});

test('renderReadmeSections maps model data to every marker name', () => {
  const sections = renderReadmeSections({
    profile: { repoCount: 1, years: 2 }, stats: { stars: 3, followers: 4 },
    languages: [{ name: 'Go', pct: 100 }], projects: [], releases: [],
  }, { languageEmoji: {} });
  assert.deepEqual(Object.keys(sections).sort(), ['languages', 'projects', 'releases', 'stack', 'stats']);
});

test('renderProjects truncates long descriptions on a word boundary', () => {
  const long = `${'word '.repeat(40)}end`;
  const md = renderProjects([{ name: 'a', url: 'u', description: long, language: null, stars: 0, forks: 0 }], {});
  const desc = md.match(/<br>(.*?)<br>/)[1];
  assert.ok(desc.length <= 121, `got ${desc.length} chars`);
  assert.match(desc, /word…$/u);
});

test('renderProjects shows the latest release as a chip when there is one', () => {
  const md = renderProjects([{ name: 'a', url: 'u', description: '', language: 'Go', stars: 1, forks: 0, release: 'v1.8.6' }], { Go: '🟩' });
  assert.match(md, /<code>🟩 Go<\/code> <code>🏷️ v1\.8\.6<\/code> <code>⭐ 1<\/code>/u);
});

test('renderStack lists one self-hosted badge per tool, named in its alt text', () => {
  const md = renderStack([{ label: 'VS Code', color: '#007ACC' }, { label: 'Go', color: '#00ADD8' }]);
  assert.match(md, /^<p align="center">\n/);
  assert.match(md, /<img src="\.\/assets\/badges\/vs-code\.svg" alt="VS Code" height="28" \/>/);
  assert.match(md, /<img src="\.\/assets\/badges\/go\.svg" alt="Go" height="28" \/>/);
  assert.equal(renderStack([]), '_No stack configured._');
});
