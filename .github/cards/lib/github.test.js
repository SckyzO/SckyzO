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

test('fetchAll returns activityGraph capped at the last 30 contribution days', async () => {
  const days = Array.from({ length: 45 }, (_, i) => ({
    date: `day-${String(i + 1).padStart(2, '0')}`,
    contributionCount: i % 5,
  }));
  const graphql = {
    data: { user: {
      contributionsCollection: { contributionCalendar: { weeks: [{ contributionDays: days }] } },
      repositories: { nodes: [] },
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
  assert.ok(data.activityGraph.length <= 30);
  assert.equal(data.activityGraph.length, 30);
  assert.equal(data.activityGraph[0].date, 'day-16');
  assert.equal(data.activityGraph[data.activityGraph.length - 1].date, 'day-45');
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

test('fetchAll excludes forked repos from language stats by default, keeps them with excludeForks:false', async () => {
  const graphql = { data: { user: {
    contributionsCollection: { contributionCalendar: { weeks: [] } },
    repositories: { nodes: [
      { name: 'mine', description: '', stargazerCount: 1, forkCount: 0, isFork: false, updatedAt: '', url: '',
        primaryLanguage: { name: 'Go', color: '#00ADD8' },
        languages: { edges: [{ size: 100, node: { name: 'Go', color: '#00ADD8' } }] } },
      { name: 'forked', description: '', stargazerCount: 0, forkCount: 0, isFork: true, updatedAt: '', url: '',
        primaryLanguage: { name: 'C', color: '#555555' },
        languages: { edges: [{ size: 9000, node: { name: 'C', color: '#555555' } }] } },
    ] },
    pullRequests: { totalCount: 0 }, issues: { totalCount: 0 }, followers: { totalCount: 0 },
  } } };
  const fetchImpl = async (url) => ({ ok: true, json: async () => (String(url).includes('/graphql') ? graphql : []) });

  const def = await fetchAll('octocat', 'tok', { fetchImpl });
  assert.deepEqual(def.languages.map((l) => l.name), ['Go']); // C came only from the fork -> excluded

  const withForks = await fetchAll('octocat', 'tok', { fetchImpl, excludeForks: false });
  assert.ok(withForks.languages.some((l) => l.name === 'C')); // fork's C counted when opted in
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

test('fetchAll exposes full-year contributionWeeks and a repoList with url/updatedAt', async () => {
  const graphql = {
    data: { user: {
      contributionsCollection: { contributionCalendar: { weeks: [
        { contributionDays: [{ date: '2026-01-01', contributionCount: 2 }, { date: '2026-01-02', contributionCount: 3 }] },
        { contributionDays: [{ date: '2026-01-03', contributionCount: 0 }] },
      ] } },
      repositories: { nodes: [
        { name: 'r1', description: 'd', stargazerCount: 9, forkCount: 1,
          updatedAt: '2026-01-05T00:00:00Z', url: 'https://github.com/o/r1',
          primaryLanguage: { name: 'Go', color: '#00ADD8' },
          languages: { edges: [{ size: 100, node: { name: 'Go', color: '#00ADD8' } }] } },
      ] },
      pullRequests: { totalCount: 1 }, issues: { totalCount: 1 }, followers: { totalCount: 1 },
    } },
  };
  const fetchImpl = async (url) => ({ ok: true, json: async () => (String(url).includes('/graphql') ? graphql : []) });
  const data = await fetchAll('octocat', 'tok', { fetchImpl });
  assert.equal(data.contributionWeeks.length, 2);
  assert.deepEqual(data.contributionWeeks[0][0], { date: '2026-01-01', count: 2 });
  assert.equal(data.repoList[0].url, 'https://github.com/o/r1');
  assert.equal(data.repoList[0].updatedAt, '2026-01-05T00:00:00Z');
  assert.equal(data.repoList[0].language, 'Go');
});

test('fetchAll drives trophies from a custom trophies config', async () => {
  const graphql = {
    data: { user: {
      contributionsCollection: { contributionCalendar: { weeks: [] } },
      repositories: { nodes: [
        { name: 'r1', description: '', stargazerCount: 9, forkCount: 0, isFork: false,
          primaryLanguage: { name: 'Go', color: '#00ADD8' }, languages: { edges: [] } },
      ] },
      pullRequests: { totalCount: 0 }, issues: { totalCount: 0 }, followers: { totalCount: 0 },
    } },
  };
  const fetchImpl = async (url) => ({ ok: true, json: async () => (String(url).includes('/graphql') ? graphql : []) });

  const trophies = [
    { kind: 'Stars', metric: 'stars', tiers: [{ min: 5, rank: 'S' }, { min: 0, rank: 'A' }] },
    { kind: 'Commit', metric: 'grade' },
  ];
  const data = await fetchAll('octocat', 'tok', { fetchImpl, trophies });
  assert.deepEqual(data.trophies, [
    { kind: 'Stars', rank: 'S' },
    { kind: 'Commit', rank: data.stats.grade },
  ]);
});

test('fetchAll honors languagesCount and activityGraphDays options', async () => {
  const days = Array.from({ length: 45 }, (_, i) => ({
    date: `day-${String(i + 1).padStart(2, '0')}`,
    contributionCount: i % 5,
  }));
  const graphql = {
    data: { user: {
      contributionsCollection: { contributionCalendar: { weeks: [{ contributionDays: days }] } },
      repositories: { nodes: [
        { name: 'r1', description: '', stargazerCount: 1, forkCount: 0, isFork: false,
          primaryLanguage: { name: 'Go', color: '#00ADD8' },
          languages: { edges: [{ size: 100, node: { name: 'Go', color: '#00ADD8' } }] } },
        { name: 'r2', description: '', stargazerCount: 1, forkCount: 0, isFork: false,
          primaryLanguage: { name: 'Python', color: '#3572A5' },
          languages: { edges: [{ size: 50, node: { name: 'Python', color: '#3572A5' } }] } },
      ] },
      pullRequests: { totalCount: 0 }, issues: { totalCount: 0 }, followers: { totalCount: 0 },
    } },
  };
  const fetchImpl = async (url) => ({ ok: true, json: async () => (String(url).includes('/graphql') ? graphql : []) });

  const data = await fetchAll('octocat', 'tok', { fetchImpl, languagesCount: 1, activityGraphDays: 10 });
  assert.equal(data.languages.length, 1);
  assert.equal(data.activityGraph.length, 10);
});

test('fetchAll honors a custom gradeConfig', async () => {
  const graphql = {
    data: { user: {
      contributionsCollection: { contributionCalendar: { weeks: [] } },
      repositories: { nodes: [] },
      pullRequests: { totalCount: 0 }, issues: { totalCount: 0 }, followers: { totalCount: 0 },
    } },
  };
  const fetchImpl = async (url) => ({ ok: true, json: async () => (String(url).includes('/graphql') ? graphql : []) });

  const gradeConfig = { weights: { commits: 0, prs: 0, issues: 0, stars: 0, contributedTo: 0 }, thresholds: { S: -1, 'A+': -2, A: -3, B: -4 } };
  const data = await fetchAll('octocat', 'tok', { fetchImpl, gradeConfig });
  assert.equal(data.stats.grade, 'S'); // score 0 > every (negative) threshold
});

test('fetchAll caps repoList at repoListCount', async () => {
  const nodes = Array.from({ length: 40 }, (_, i) => ({
    name: `r${i}`, description: '', stargazerCount: 40 - i, forkCount: 0,
    updatedAt: '2026-01-01T00:00:00Z', url: `https://github.com/o/r${i}`,
    primaryLanguage: { name: 'Go', color: '#00ADD8' }, languages: { edges: [] },
  }));
  const graphql = { data: { user: {
    contributionsCollection: { contributionCalendar: { weeks: [] } },
    repositories: { nodes }, pullRequests: { totalCount: 0 }, issues: { totalCount: 0 }, followers: { totalCount: 0 },
  } } };
  const fetchImpl = async (url) => ({ ok: true, json: async () => (String(url).includes('/graphql') ? graphql : []) });
  const data = await fetchAll('octocat', 'tok', { fetchImpl, repoListCount: 10 });
  assert.equal(data.repoList.length, 10);
});
