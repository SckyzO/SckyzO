import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  compactNumber, escapeHtml, languageBars, renderStatsRow, renderLanguages,
  renderProjects, renderContributions, renderReleases, injectSections, renderReadmeSections,
} from './markdown.mjs';

test('compactNumber keeps small numbers and abbreviates thousands', () => {
  assert.equal(compactNumber(196), '196');
  assert.equal(compactNumber(8600), '8.6k');
  assert.equal(compactNumber(12000), '12k');
});

test('escapeHtml neutralises markup coming from repo descriptions', () => {
  assert.equal(escapeHtml('<b>a & "b"</b>'), '&lt;b&gt;a &amp; &quot;b&quot;&lt;/b&gt;');
});

test('languageBars draws 10 cells, at least one filled cell per listed language', () => {
  const out = languageBars([{ name: 'Python', pct: 45 }, { name: 'Go', pct: 4 }], { Python: '🟨', Go: '🟩' });
  const [py, go] = out.split('\n');
  assert.match(py, /^Python {2}🟨{5}⬜{5} {2}45 %$/u); // round(45/10) = 5 (half rounds up)
  assert.match(go, /^Go {6}🟩⬜{9} {3}4 %$/u); // 4 % would round to 0 cells; forced to 1
});

test('languageBars falls back to a neutral square for unmapped languages', () => {
  assert.match(languageBars([{ name: 'Zig', pct: 30 }], {}), /⬛{3}/u);
});

test('renderStatsRow renders a centred 4-column table', () => {
  const md = renderStatsRow({ repoCount: 63, stars: 196, contributions: 8600, years: 15 });
  assert.match(md, /<div align="center">/);
  assert.match(md, /\| 📦 \*\*63\*\* \| ⭐ \*\*196\*\* \| 🔥 \*\*8\.6k\*\* \| 🗓️ \*\*15\*\* \|/u);
  assert.match(md, /\|:-:\|:-:\|:-:\|:-:\|/);
});

test('renderLanguages wraps the bars in a fenced text block', () => {
  const md = renderLanguages([{ name: 'Go', pct: 100 }], { Go: '🟩' });
  assert.match(md, /^```text\nGo {2}🟩{10} {2}100 %\n```$/u);
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
  assert.match(md, /🟩 Go/u);
  assert.match(md, /⭐ 3 · 🍴 1/u);
  assert.doesNotMatch(md, /🍴 0/u); // zero forks is noise
  assert.match(md, /<td width="50%" valign="top"><\/td>/); // odd count: last row padded
  assert.equal((md.match(/<td width="50%" valign="top">/g) || []).length, 4); // cards of uneven height stay top-aligned
});

test('renderContributions renders a table and escapes pipes', () => {
  const md = renderContributions([{ repo: 'prometheus/docs', url: 'https://x', prs: 1, stars: 726 }]);
  assert.match(md, /\| \[prometheus\/docs\]\(https:\/\/x\) \| 1 \| 726 \|/);
  assert.equal(renderContributions([]), '_No merged pull requests to other projects yet._');
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
    profile: { repoCount: 1, years: 2 }, stats: { stars: 3, contributions: 4 },
    languages: [{ name: 'Go', pct: 100 }], projects: [], contributions: [], releases: [],
  }, {});
  assert.deepEqual(Object.keys(sections).sort(), ['contributions', 'languages', 'projects', 'releases', 'stats']);
});

test('renderProjects truncates long descriptions on a word boundary', () => {
  const long = `${'word '.repeat(40)}end`;
  const md = renderProjects([{ name: 'a', url: 'u', description: long, language: null, stars: 0, forks: 0 }], {});
  const desc = md.match(/<br>(.*?)<br>/)[1];
  assert.ok(desc.length <= 121, `got ${desc.length} chars`);
  assert.match(desc, /word…$/u);
});
