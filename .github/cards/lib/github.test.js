// .github/cards/lib/github.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveToken, fetchAll } from './github.mjs';

test('resolveToken prefers CARDS_TOKEN then GITHUB_TOKEN', () => {
  assert.equal(resolveToken({ CARDS_TOKEN: 'a', GITHUB_TOKEN: 'b' }), 'a');
  assert.equal(resolveToken({ GITHUB_TOKEN: 'b' }), 'b');
  assert.throws(() => resolveToken({}), /no token/i);
});

test('fetchAll aggregates language edges by name across repos before ranking', async () => {
  const graphql = {
    data: { user: {
      followers: { totalCount: 0 },
      repositories: { nodes: [
        { name: 'go-one', description: '', stargazerCount: 1, forkCount: 0,
          primaryLanguage: { name: 'Go' },
          languages: { edges: [{ size: 100, node: { name: 'Go' } }] } },
        { name: 'go-two', description: '', stargazerCount: 1, forkCount: 0,
          primaryLanguage: { name: 'Go' },
          languages: { edges: [{ size: 50, node: { name: 'Go' } }] } },
        { name: 'py-one', description: '', stargazerCount: 1, forkCount: 0,
          primaryLanguage: { name: 'Python' },
          languages: { edges: [{ size: 50, node: { name: 'Python' } }] } },
      ] },
      createdAt: '2020-01-01T00:00:00Z', repoCount: { totalCount: 0 },
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
    followers: { totalCount: 0 },
    repositories: { nodes: [
      { name: 'mine', description: '', stargazerCount: 1, forkCount: 0, isFork: false, updatedAt: '', url: '',
        primaryLanguage: { name: 'Go' },
        languages: { edges: [{ size: 100, node: { name: 'Go' } }] } },
      { name: 'forked', description: '', stargazerCount: 0, forkCount: 0, isFork: true, updatedAt: '', url: '',
        primaryLanguage: { name: 'C' },
        languages: { edges: [{ size: 9000, node: { name: 'C' } }] } },
    ] },
    createdAt: '2020-01-01T00:00:00Z', repoCount: { totalCount: 0 },
  } } };
  const fetchImpl = async (url) => ({ ok: true, json: async () => (String(url).includes('/graphql') ? graphql : []) });

  const def = await fetchAll('octocat', 'tok', { fetchImpl });
  assert.deepEqual(def.languages.map((l) => l.name), ['Go']); // C came only from the fork -> excluded

  const withForks = await fetchAll('octocat', 'tok', { fetchImpl, excludeForks: false });
  assert.ok(withForks.languages.some((l) => l.name === 'C')); // fork's C counted when opted in
});

test('fetchAll keeps archived repos in language stats by default, drops them with excludeArchived:true', async () => {
  const graphql = { data: { user: {
    followers: { totalCount: 0 },
    repositories: { nodes: [
      { name: 'live', description: '', stargazerCount: 1, forkCount: 0, isFork: false, isArchived: false, updatedAt: '', url: '',
        primaryLanguage: { name: 'Go' },
        languages: { edges: [{ size: 100, node: { name: 'Go' } }] } },
      { name: 'old', description: '', stargazerCount: 0, forkCount: 0, isFork: false, isArchived: true, updatedAt: '', url: '',
        primaryLanguage: { name: 'PHP' },
        languages: { edges: [{ size: 9000, node: { name: 'PHP' } }] } },
    ] },
    createdAt: '2020-01-01T00:00:00Z', repoCount: { totalCount: 0 },
  } } };
  const fetchImpl = async (url) => ({ ok: true, json: async () => (String(url).includes('/graphql') ? graphql : []) });

  const def = await fetchAll('octocat', 'tok', { fetchImpl });
  assert.ok(def.languages.some((l) => l.name === 'PHP')); // default unchanged: archived repo still counted

  const noArchived = await fetchAll('octocat', 'tok', { fetchImpl, excludeArchived: true });
  assert.deepEqual(noArchived.languages.map((l) => l.name), ['Go']);
  assert.equal(noArchived.stats.stars, 1); // only language stats are filtered, not repo totals
});

test('fetchAll threads repoScanLimit into the GraphQL request and makes no other HTTP call', async () => {
  const graphql = {
    data: { user: {
      followers: { totalCount: 0 },
      repositories: { nodes: [] },
      createdAt: '2020-01-01T00:00:00Z', repoCount: { totalCount: 0 },
    } },
  };
  const calls = [];
  const fetchImpl = async (url, opts) => {
    calls.push({ url: String(url), opts });
    return { ok: true, json: async () => (String(url).includes('/graphql') ? graphql : []) };
  };

  await fetchAll('octocat', 'tok', { fetchImpl, repoScanLimit: 7 });

  const gqlCall = calls.find((c) => c.url.includes('/graphql'));
  const body = JSON.parse(gqlCall.opts.body);
  assert.equal(body.variables.repoLimit, 7, 'repoScanLimit must reach the graphql request as a variable');
  assert.match(body.query, /\$repoLimit\s*:\s*Int!/, 'query must declare a $repoLimit variable');
  assert.match(body.query, /first:\s*\$repoLimit\b/, 'repositories(first:...) must reference the variable');
  assert.ok(!body.query.includes('first:100'), 'the limit must not be string-interpolated into the query body');

  assert.equal(calls.length, 1, 'everything the README needs comes from the single GraphQL query');
});

test('fetchAll builds the README model: profile, followers, projects, releases', async () => {
  const repo = (name, extra = {}) => ({ name, description: `${name} d`, stargazerCount: 0, forkCount: 0, isFork: false,
    isArchived: false, isPrivate: false, updatedAt: '', url: `https://github.com/octocat/${name}`,
    primaryLanguage: { name: 'Go' }, languages: { edges: [] }, latestRelease: null, ...extra });
  const graphql = { data: {
    user: {
      createdAt: '2011-03-10T00:00:00Z',
      repoCount: { totalCount: 63 },
      followers: { totalCount: 16 },
      repositories: { nodes: [
        repo('exporter', { stargazerCount: 59, latestRelease: { tagName: 'v1.0.0', publishedAt: '2026-10-01T00:00:00Z', url: 'https://r/1' } }),
        repo('ui', { stargazerCount: 3 }),
      ] },
    },
  } };
  let sent;
  const fetchImpl = async (url, opts) => {
    if (String(url).includes('/graphql')) sent = JSON.parse(opts.body);
    return { ok: true, json: async () => (String(url).includes('/graphql') ? graphql : []) };
  };

  const d = await fetchAll('octocat', 'tok', { fetchImpl, projects: ['ui', 'exporter'], now: Date.parse('2026-11-05T00:00:00Z') });

  assert.deepEqual(Object.keys(sent.variables).sort(), ['login', 'repoLimit']);
  assert.doesNotMatch(sent.query, /search\(|contributionsCollection/, 'no PR search and no yearly contribution count');
  assert.deepEqual(d.profile, { repoCount: 63, years: 15 });
  assert.deepEqual(d.stats, { stars: 62, followers: 16 });
  assert.deepEqual(d.projects.map((p) => p.name), ['ui', 'exporter']);
  assert.deepEqual(d.releases, [{ repo: 'exporter', tag: 'v1.0.0', url: 'https://r/1', date: '2026-10-01T00:00:00Z' }]);
});

test('fetchAll only queries public repositories', async () => {
  let sent;
  const fetchImpl = async (url, opts) => {
    sent = JSON.parse(opts.body);
    return { ok: true, json: async () => ({ data: { user: {
      createdAt: '2020-01-01T00:00:00Z', repoCount: { totalCount: 0 },
      followers: { totalCount: 0 }, repositories: { nodes: [] },
    } } }) };
  };
  await fetchAll('octocat', 'tok', { fetchImpl });
  // A fine-grained PAT without access to private repos fails the whole query on their
  // release/language fields, and a public profile must not show private data anyway.
  assert.match(sent.query, /repositories\(first:\$repoLimit, ownerAffiliations:OWNER, privacy:PUBLIC/);
});

test('fetchAll names the failing field when GitHub rejects part of the query', async () => {
  const fetchImpl = async () => ({ ok: true, json: async () => ({
    errors: [{ message: 'Resource not accessible by personal access token', path: ['user', 'repositories', 'nodes', 3, 'latestRelease'] }],
  }) });
  await assert.rejects(fetchAll('octocat', 'tok', { fetchImpl }),
    /graphql: Resource not accessible by personal access token \(at user\.repositories\.nodes\.3\.latestRelease\)/);
});
