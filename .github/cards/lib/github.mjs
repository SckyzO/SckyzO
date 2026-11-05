import { topLanguages, pickProjects, latestReleases, yearsSince } from './transform.mjs';

export function resolveToken(env = process.env) {
  const t = env.CARDS_TOKEN || env.GITHUB_TOKEN;
  if (!t) throw new Error('no token: set CARDS_TOKEN or GITHUB_TOKEN');
  return t;
}

const QUERY = `query($login:String!,$repoLimit:Int!){ user(login:$login){
  createdAt
  followers{ totalCount }
  repoCount: repositories(ownerAffiliations:OWNER, privacy:PUBLIC){ totalCount }
  repositories(first:$repoLimit, ownerAffiliations:OWNER, privacy:PUBLIC, orderBy:{field:STARGAZERS, direction:DESC}){
    nodes{ name description stargazerCount forkCount url isFork isArchived isPrivate
      latestRelease{ tagName publishedAt url }
      primaryLanguage{ name }
      languages(first:10, orderBy:{field:SIZE, direction:DESC}){ edges{ size node{ name } } } } }
} }`;

/** Sums language bytes by name across repos, skipping forks/archived repos on request. */
function languageTotals(repos, { excludeForks, excludeArchived }) {
  const totals = new Map();
  for (const r of repos) {
    if (excludeForks && r.isFork) continue; // forked repos vendor large codebases that skew language stats
    if (excludeArchived && r.isArchived) continue; // abandoned code no longer reflects the current stack
    for (const e of r.languages?.edges || []) {
      const name = e.node.name;
      const existing = totals.get(name);
      if (existing) existing.size += e.size;
      else totals.set(name, { size: e.size, node: { name } });
    }
  }
  return [...totals.values()];
}

export async function fetchAll(username, token, {
  fetchImpl = fetch, excludeForks = true, excludeArchived = false, languagesCount = 5, repoScanLimit = 100,
  projects = [], releasesCount = 5, releasesExclude = [], now = Date.now(),
} = {}) {
  const res = await fetchImpl('https://api.github.com/graphql', {
    method: 'POST',
    headers: { Authorization: `bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: QUERY, variables: { login: username, repoLimit: repoScanLimit } }),
  });
  if (!res.ok) throw new Error(`graphql ${res.status}`);
  const gql = await res.json();
  if (gql.errors) {
    const [e] = gql.errors;
    // The path pinpoints which field a token lacks permission for.
    throw new Error(`graphql: ${e.message}${e.path ? ` (at ${e.path.join('.')})` : ''}`);
  }
  const u = gql.data.user;
  const repos = u.repositories.nodes;

  return {
    user: username,
    stats: {
      stars: repos.reduce((s, r) => s + r.stargazerCount, 0),
      followers: u.followers.totalCount,
    },
    profile: { repoCount: u.repoCount.totalCount, years: yearsSince(u.createdAt, now) },
    languages: topLanguages(languageTotals(repos, { excludeForks, excludeArchived }), languagesCount),
    projects: pickProjects(repos, projects),
    releases: latestReleases(repos, releasesCount, releasesExclude),
  };
}
