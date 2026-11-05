import { test } from 'node:test';
import assert from 'node:assert/strict';
import { topLanguages, pickProjects, latestReleases, externalContributions, yearsSince } from './transform.mjs';

const node = (name, extra = {}) => ({
  name, description: `${name} desc`, url: `https://github.com/o/${name}`, stargazerCount: 0, forkCount: 0,
  isFork: false, isPrivate: false, primaryLanguage: { name: 'Go' }, latestRelease: null, ...extra,
});

test('topLanguages returns percentages summing ~100 for the top n', () => {
  const edges = [
    { size: 340, node: { name: 'Go' } },
    { size: 260, node: { name: 'Python' } },
    { size: 400, node: { name: 'Shell' } },
  ];
  const langs = topLanguages(edges, 2);
  assert.equal(langs.length, 2);
  assert.equal(langs[0].name, 'Shell'); // largest first
  assert.ok(langs.every((l) => l.pct > 0));
});

test('pickProjects keeps the configured order and fails fast on an unknown repo', () => {
  const repos = [node('a', { stargazerCount: 9 }), node('b'), node('c')];
  assert.deepEqual(pickProjects(repos, ['c', 'a']).map((p) => p.name), ['c', 'a']);
  assert.throws(() => pickProjects(repos, ['nope']), /nope/);
});

test('pickProjects without a list falls back to the most-starred public, non-fork repos', () => {
  const repos = [node('fork', { isFork: true, stargazerCount: 99 }), node('secret', { isPrivate: true, stargazerCount: 50 }),
    node('top', { stargazerCount: 5 }), node('low', { stargazerCount: 1 })];
  assert.deepEqual(pickProjects(repos, [], 2).map((p) => p.name), ['top', 'low']);
});

test('pickProjects refuses a private repo even when listed explicitly', () => {
  assert.throws(() => pickProjects([node('secret', { isPrivate: true })], ['secret']), /private/);
});

test('pickProjects maps to the renderer shape', () => {
  const [p] = pickProjects([node('a', { stargazerCount: 3, forkCount: 1 })], ['a']);
  assert.deepEqual(p, { name: 'a', url: 'https://github.com/o/a', description: 'a desc', language: 'Go', stars: 3, forks: 1 });
});

test('latestReleases sorts newest first and skips forks, private repos and repos without releases', () => {
  const rel = (tag, at) => ({ tagName: tag, publishedAt: at, url: `https://r/${tag}` });
  const repos = [
    node('old', { latestRelease: rel('v1', '2026-01-01T00:00:00Z') }),
    node('new', { latestRelease: rel('v2', '2026-06-01T00:00:00Z') }),
    node('none'),
    node('fork', { isFork: true, latestRelease: rel('v9', '2026-09-01T00:00:00Z') }),
    node('secret', { isPrivate: true, latestRelease: rel('v8', '2026-08-01T00:00:00Z') }),
  ];
  assert.deepEqual(latestReleases(repos, 5), [
    { repo: 'new', tag: 'v2', url: 'https://r/v2', date: '2026-06-01T00:00:00Z' },
    { repo: 'old', tag: 'v1', url: 'https://r/v1', date: '2026-01-01T00:00:00Z' },
  ]);
  assert.equal(latestReleases(repos, 1).length, 1);
});

test('externalContributions groups merged PRs per repo, most PRs first', () => {
  const pr = (repo, stars) => ({ repository: { nameWithOwner: repo, url: `https://github.com/${repo}`, stargazerCount: stars } });
  const out = externalContributions([pr('a/x', 10), pr('b/y', 500), pr('a/x', 10), pr('c/z', 3)], 2);
  assert.deepEqual(out, [
    { repo: 'a/x', url: 'https://github.com/a/x', prs: 2, stars: 10 },
    { repo: 'b/y', url: 'https://github.com/b/y', prs: 1, stars: 500 }, // tie on PRs broken by stars
  ]);
});

test('externalContributions ignores empty search nodes', () => {
  assert.deepEqual(externalContributions([{}, null], 5), []); // non-PR search hits come back as empty objects
});

test('yearsSince counts full years only', () => {
  const now = Date.parse('2026-11-05T00:00:00Z');
  assert.equal(yearsSince('2011-03-10T00:00:00Z', now), 15);
  assert.equal(yearsSince('2011-11-06T00:00:00Z', now), 14);
});

test('latestReleases drops repos listed in exclude', () => {
  const rel = { tagName: 'v1', publishedAt: '2026-01-01T00:00:00Z', url: 'u' };
  const repos = [node('keep', { latestRelease: rel }), node('personal', { latestRelease: rel })];
  assert.deepEqual(latestReleases(repos, 5, ['personal']).map((r) => r.repo), ['keep']);
});
