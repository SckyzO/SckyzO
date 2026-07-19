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
