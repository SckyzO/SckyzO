import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeStreak, computeGrade, topLanguages, pickTopRepos, mapActivity } from './transform.mjs';

test('computeStreak counts total, current and longest', () => {
  const days = [
    { date: '2026-01-01', count: 1 }, { date: '2026-01-02', count: 0 },
    { date: '2026-01-03', count: 2 }, { date: '2026-01-04', count: 3 },
    { date: '2026-01-05', count: 1 },
  ];
  const s = computeStreak(days);
  assert.equal(s.total, 7);
  assert.equal(s.current, 3);   // last three days non-zero
  assert.equal(s.longest, 3);
});

test('computeGrade returns a rank string', () => {
  assert.equal(typeof computeGrade({ commits: 4000, prs: 190, issues: 70, stars: 300, contributedTo: 40 }), 'string');
});

test('topLanguages returns percentages summing ~100 for the top n', () => {
  const edges = [
    { size: 340, node: { name: 'Go', color: '#00ADD8' } },
    { size: 260, node: { name: 'Python', color: '#3572A5' } },
    { size: 400, node: { name: 'Shell', color: '#89e051' } },
  ];
  const langs = topLanguages(edges, 2);
  assert.equal(langs.length, 2);
  assert.equal(langs[0].name, 'Shell'); // largest first
  assert.ok(langs.every((l) => l.pct > 0));
});

test('pickTopRepos sorts by stars and trims fields', () => {
  const repos = [
    { name: 'a', description: 'x', stargazerCount: 5, forkCount: 1, primaryLanguage: { name: 'Go', color: '#00ADD8' } },
    { name: 'b', description: 'y', stargazerCount: 20, forkCount: 2, primaryLanguage: null },
  ];
  const t = pickTopRepos(repos, 5);
  assert.equal(t[0].name, 'b');
  assert.equal(t[0].language, '');
  assert.equal(t[1].stars, 5);
});

test('mapActivity classifies event types', () => {
  const events = [
    { type: 'PushEvent', repo: { name: 'o/r' }, payload: { commits: [1, 2] } },
    { type: 'WatchEvent', repo: { name: 'o/s' }, payload: {} },
  ];
  const a = mapActivity(events, 5);
  assert.equal(a[0].type, 'push');
  assert.equal(a[1].type, 'star');
});
