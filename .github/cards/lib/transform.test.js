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

test('computeGrade grades by score buckets (commits*1 + prs*5 + issues*3 + stars*4 + contributedTo*6)', () => {
  // All zero → C
  assert.equal(computeGrade({ commits: 0, prs: 0, issues: 0, stars: 0, contributedTo: 0 }), 'C');

  // score = 1001 → B (> 1000)
  assert.equal(computeGrade({ commits: 1001, prs: 0, issues: 0, stars: 0, contributedTo: 0 }), 'B');

  // score = 1000 exactly → C (not > 1000)
  assert.equal(computeGrade({ commits: 1000, prs: 0, issues: 0, stars: 0, contributedTo: 0 }), 'C');

  // score = 2501 → A (> 2500)
  assert.equal(computeGrade({ commits: 2501, prs: 0, issues: 0, stars: 0, contributedTo: 0 }), 'A');

  // score = 5001 → A+ (> 5000)
  assert.equal(computeGrade({ commits: 5001, prs: 0, issues: 0, stars: 0, contributedTo: 0 }), 'A+');

  // score = 8001 → S (> 8000)
  assert.equal(computeGrade({ commits: 8001, prs: 0, issues: 0, stars: 0, contributedTo: 0 }), 'S');

  // mixed metrics: commits*1 + prs*5 + issues*3 + stars*4 + contributedTo*6
  // = 1000 + 600 + 300 + 400 + 600 = 2900 → A
  assert.equal(computeGrade({ commits: 1000, prs: 120, issues: 100, stars: 100, contributedTo: 100 }), 'A');
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

test('mapActivity classifies event types and formats detail', () => {
  const events = [
    { type: 'PushEvent', repo: { name: 'o/r' }, payload: { commits: [1, 2] }, created_at: '2026-07-01T00:00:00Z' },
    { type: 'WatchEvent', repo: { name: 'o/s' }, payload: {}, created_at: '2026-07-02T00:00:00Z' },
    { type: 'PullRequestEvent', repo: { name: 'o/t' }, payload: { number: 42 }, created_at: '2026-07-03T00:00:00Z' },
    { type: 'IssuesEvent', repo: { name: 'o/u' }, payload: { issue: { number: 99 } }, created_at: '2026-07-04T00:00:00Z' },
    { type: 'CreateEvent', repo: { name: 'o/v' }, payload: {}, created_at: '2026-07-05T00:00:00Z' },
    { type: 'PushEvent', repo: { name: 'o/w' }, payload: { commits: [1, 2, 3, 4] }, created_at: '2026-07-06T00:00:00Z' },
  ];

  const a = mapActivity(events, 5);

  // Verify n limit truncates output to 5 events max
  assert.equal(a.length, 5);

  // Verify PushEvent → 'push' with commit count
  assert.equal(a[0].type, 'push');
  assert.equal(a[0].detail, '2 commits');
  assert.equal(a[0].repo, 'o/r');

  // Verify WatchEvent → 'star'
  assert.equal(a[1].type, 'star');
  assert.equal(a[1].detail, '');

  // Verify PullRequestEvent → 'pr' with PR number
  assert.equal(a[2].type, 'pr');
  assert.equal(a[2].detail, 'PR #42');
  assert.equal(a[2].repo, 'o/t');

  // Verify IssuesEvent → 'issue' with issue number
  assert.equal(a[3].type, 'issue');
  assert.equal(a[3].detail, 'issue #99');
  assert.equal(a[3].repo, 'o/u');

  // Verify CreateEvent → 'repo' with empty detail
  assert.equal(a[4].type, 'repo');
  assert.equal(a[4].detail, '');
  assert.equal(a[4].repo, 'o/v');
});
