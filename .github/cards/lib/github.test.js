// .github/cards/lib/github.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveToken, fetchAll } from './github.mjs';

test('resolveToken prefers CARDS_TOKEN then GITHUB_TOKEN', () => {
  assert.equal(resolveToken({ CARDS_TOKEN: 'a', GITHUB_TOKEN: 'b' }), 'a');
  assert.equal(resolveToken({ GITHUB_TOKEN: 'b' }), 'b');
  assert.throws(() => resolveToken({}), /no token/i);
});

test('fetchAll assembles the model from mocked responses', async () => {
  const graphql = {
    data: { user: {
      contributionsCollection: { contributionCalendar: { weeks: [
        { contributionDays: [{ date: '2026-01-01', contributionCount: 2 }, { date: '2026-01-02', contributionCount: 3 }] },
      ] } },
      repositories: { nodes: [
        { name: 'r1', description: 'd', stargazerCount: 9, forkCount: 1,
          primaryLanguage: { name: 'Go', color: '#00ADD8' },
          languages: { edges: [{ size: 100, node: { name: 'Go', color: '#00ADD8' } }] } },
      ] },
      pullRequests: { totalCount: 12 }, issues: { totalCount: 4 },
      followers: { totalCount: 7 },
    } },
  };
  const rest = [{ type: 'PushEvent', repo: { name: 'o/r1' }, payload: { commits: [1] }, created_at: '2026-01-02T10:00:00Z' }];

  const fetchImpl = async (url) => ({
    ok: true,
    json: async () => (String(url).includes('/graphql') ? graphql : rest),
  });

  const data = await fetchAll('octocat', 'tok', { fetchImpl });
  assert.equal(data.user, 'octocat');
  assert.equal(data.streak.total, 5);
  assert.equal(data.topRepos[0].name, 'r1');
  assert.equal(data.activity[0].type, 'push');
  assert.ok(data.stats.grade);
});

test('fetchAll aggregates language edges by name across repos before ranking', async () => {
  const graphql = {
    data: { user: {
      contributionsCollection: { contributionCalendar: { weeks: [] } },
      repositories: { nodes: [
        { name: 'go-one', description: '', stargazerCount: 1, forkCount: 0,
          primaryLanguage: { name: 'Go', color: '#00ADD8' },
          languages: { edges: [{ size: 100, node: { name: 'Go', color: '#00ADD8' } }] } },
        { name: 'go-two', description: '', stargazerCount: 1, forkCount: 0,
          primaryLanguage: { name: 'Go', color: '#00ADD8' },
          languages: { edges: [{ size: 50, node: { name: 'Go', color: '#00ADD8' } }] } },
        { name: 'py-one', description: '', stargazerCount: 1, forkCount: 0,
          primaryLanguage: { name: 'Python', color: '#3572A5' },
          languages: { edges: [{ size: 50, node: { name: 'Python', color: '#3572A5' } }] } },
      ] },
      pullRequests: { totalCount: 0 }, issues: { totalCount: 0 },
      followers: { totalCount: 0 },
    } },
  };
  const rest = [];

  const fetchImpl = async (url) => ({
    ok: true,
    json: async () => (String(url).includes('/graphql') ? graphql : rest),
  });

  const data = await fetchAll('octocat', 'tok', { fetchImpl });
  const goEntries = data.languages.filter((l) => l.name === 'Go');
  assert.equal(goEntries.length, 1);
  // Go: 100 + 50 = 150, Python: 50, total = 200 -> Go pct = round(150/200*100) = 75
  assert.equal(goEntries[0].pct, 75);
  const pyEntries = data.languages.filter((l) => l.name === 'Python');
  assert.equal(pyEntries.length, 1);
  assert.equal(pyEntries[0].pct, 25);
});

test('fetchAll honors topReposCount and activityCount options', async () => {
  const graphql = {
    data: { user: {
      contributionsCollection: { contributionCalendar: { weeks: [] } },
      repositories: { nodes: [
        { name: 'r1', description: '', stargazerCount: 3, forkCount: 0,
          primaryLanguage: { name: 'Go', color: '#00ADD8' }, languages: { edges: [] } },
        { name: 'r2', description: '', stargazerCount: 2, forkCount: 0,
          primaryLanguage: { name: 'Go', color: '#00ADD8' }, languages: { edges: [] } },
        { name: 'r3', description: '', stargazerCount: 1, forkCount: 0,
          primaryLanguage: { name: 'Go', color: '#00ADD8' }, languages: { edges: [] } },
      ] },
      pullRequests: { totalCount: 0 }, issues: { totalCount: 0 },
      followers: { totalCount: 0 },
    } },
  };
  const rest = [
    { type: 'PushEvent', repo: { name: 'o/r1' }, payload: { commits: [1] }, created_at: '2026-01-01T10:00:00Z' },
    { type: 'PushEvent', repo: { name: 'o/r2' }, payload: { commits: [1] }, created_at: '2026-01-02T10:00:00Z' },
    { type: 'PushEvent', repo: { name: 'o/r3' }, payload: { commits: [1] }, created_at: '2026-01-03T10:00:00Z' },
  ];

  const fetchImpl = async (url) => ({
    ok: true,
    json: async () => (String(url).includes('/graphql') ? graphql : rest),
  });

  const data = await fetchAll('octocat', 'tok', { fetchImpl, topReposCount: 2, activityCount: 2 });
  assert.equal(data.topRepos.length, 2);
  assert.equal(data.activity.length, 2);
});
