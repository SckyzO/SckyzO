import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeStreak, computeGrade, topLanguages, pickTopRepos, mapActivity, computeTrophies, DEFAULT_TROPHIES } from './transform.mjs';

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

test('computeGrade honors a custom weights/thresholds config', () => {
  const cfg = { weights: { stars: 100 }, thresholds: { S: 100, 'A+': 50, A: 10, B: 1 } };
  // score = stars(100) * weight(100) = 10000 -> far above the S threshold (100)
  assert.equal(computeGrade({ stars: 100 }, cfg), 'S');
});

test('computeGrade with no cfg arg still uses the built-in defaults', () => {
  // commits:1 -> score 1, below every threshold -> C, same as before config existed
  assert.equal(computeGrade({ commits: 1 }), 'C');
});

test('computeTrophies picks the grade rank for a metric:"grade" entry', () => {
  const stats = { stars: 0, prs: 0, issues: 0, followers: 0, contributedTo: 0, grade: 'A+' };
  const trophies = computeTrophies(stats, [{ kind: 'Commit', metric: 'grade' }]);
  assert.deepEqual(trophies, [{ kind: 'Commit', rank: 'A+' }]);
});

test('computeTrophies picks the tier whose min is strictly below the metric value', () => {
  const stats = { stars: 9, prs: 0, issues: 0, followers: 0, contributedTo: 0, grade: 'C' };
  const trophies = computeTrophies(stats, [
    { kind: 'Stars', metric: 'stars', tiers: [{ min: 5, rank: 'S' }, { min: 0, rank: 'A' }] },
  ]);
  assert.deepEqual(trophies, [{ kind: 'Stars', rank: 'S' }]);
});

test('computeTrophies with the default config reproduces the old boundary exactly at stars=200', () => {
  // Old hardcoded rule was `stars > 200 ? 'S' : 'A'` — 200 itself fell through to 'A'.
  // DEFAULT_TROPHIES' Stars tier uses min:200, so the terminal tier is an
  // unconditional catch-all and non-terminal tiers require a STRICT `>`
  // match; this preserves that exact boundary instead of a naive `min<=value`.
  const stats = { stars: 200, prs: 0, issues: 0, followers: 0, contributedTo: 0, grade: 'C' };
  const trophies = computeTrophies(stats, DEFAULT_TROPHIES);
  const starsTrophy = trophies.find((t) => t.kind === 'Stars');
  assert.equal(starsTrophy.rank, 'A');
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

test('mapActivity coalesces consecutive pushes to the same repo and sums their commits', () => {
  const events = [
    { type: 'PushEvent', repo: { name: 'o/r' }, payload: { size: 3 }, created_at: '2026-07-06T10:00:00Z' },
    { type: 'PushEvent', repo: { name: 'o/r' }, payload: { size: 2 }, created_at: '2026-07-06T09:00:00Z' },
    { type: 'PushEvent', repo: { name: 'o/r' }, payload: { commits: [1] }, created_at: '2026-07-06T08:00:00Z' },
    { type: 'PushEvent', repo: { name: 'o/s' }, payload: { size: 1 }, created_at: '2026-07-05T00:00:00Z' },
  ];
  const a = mapActivity(events, 5);
  assert.equal(a.length, 2);                       // three o/r pushes merge into one row
  assert.equal(a[0].repo, 'o/r');
  assert.equal(a[0].detail, '6 commits');          // 3 + 2 + 1
  assert.equal(a[0].when, '2026-07-06T10:00:00Z'); // keeps the most recent timestamp
  assert.equal(a[1].repo, 'o/s');
  assert.equal(a[1].detail, '1 commit');           // singular
});

test('mapActivity hides the commit detail when a push payload is empty (unknown count)', () => {
  const events = [
    { type: 'PushEvent', repo: { name: 'o/r' }, payload: { commits: [], size: 0 }, created_at: '2026-07-06T00:00:00Z' },
  ];
  const a = mapActivity(events, 5);
  assert.equal(a.length, 1);
  assert.equal(a[0].type, 'push');
  assert.equal(a[0].detail, '');                   // no "0 commits" noise
});

test('mapActivity does not merge non-adjacent pushes to the same repo', () => {
  const events = [
    { type: 'PushEvent', repo: { name: 'o/r' }, payload: { size: 1 }, created_at: '2026-07-06T00:00:00Z' },
    { type: 'WatchEvent', repo: { name: 'o/s' }, payload: {}, created_at: '2026-07-05T00:00:00Z' },
    { type: 'PushEvent', repo: { name: 'o/r' }, payload: { size: 1 }, created_at: '2026-07-04T00:00:00Z' },
  ];
  const a = mapActivity(events, 5);
  assert.equal(a.length, 3);                       // the star between them breaks the run
  assert.deepEqual(a.map((x) => x.repo), ['o/r', 'o/s', 'o/r']);
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
