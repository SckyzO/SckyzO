import { computeStreak, computeGrade, topLanguages, pickTopRepos, mapActivity } from './transform.mjs';

export function resolveToken(env = process.env) {
  const t = env.CARDS_TOKEN || env.GITHUB_TOKEN;
  if (!t) throw new Error('no token: set CARDS_TOKEN or GITHUB_TOKEN');
  return t;
}

const QUERY = `query($login:String!){ user(login:$login){
  contributionsCollection{ contributionCalendar{ weeks{ contributionDays{ date contributionCount } } } }
  repositories(first:100, ownerAffiliations:OWNER, orderBy:{field:STARGAZERS, direction:DESC}){
    nodes{ name description stargazerCount forkCount updatedAt url isFork
      primaryLanguage{ name color }
      languages(first:10, orderBy:{field:SIZE, direction:DESC}){ edges{ size node{ name color } } } } }
  pullRequests{ totalCount } issues{ totalCount } followers{ totalCount }
} }`;

export async function fetchAll(username, token, { fetchImpl = fetch, topReposCount = 5, activityCount = 5, repoListCount = 30, excludeForks = true } = {}) {
  const gqlRes = await fetchImpl('https://api.github.com/graphql', {
    method: 'POST',
    headers: { Authorization: `bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: QUERY, variables: { login: username } }),
  });
  if (!gqlRes.ok) throw new Error(`graphql ${gqlRes.status}`);
  const gql = await gqlRes.json();
  if (gql.errors) throw new Error(`graphql: ${gql.errors[0].message}`);
  const u = gql.data.user;

  const evRes = await fetchImpl(`https://api.github.com/users/${username}/events/public?per_page=30`, {
    headers: { Authorization: `bearer ${token}`, 'User-Agent': 'profile-cards' },
  });
  if (!evRes.ok) throw new Error(`events ${evRes.status}`);
  const events = await evRes.json();

  const days = u.contributionsCollection.contributionCalendar.weeks
    .flatMap((w) => w.contributionDays)
    .map((d) => ({ date: d.date, count: d.contributionCount }));
  const repos = u.repositories.nodes;
  const langTotals = new Map();
  for (const r of repos) {
    if (excludeForks && r.isFork) continue; // forked repos vendor large codebases that skew language stats
    for (const e of r.languages?.edges || []) {
      const name = e.node.name;
      const existing = langTotals.get(name);
      if (existing) existing.size += e.size;
      else langTotals.set(name, { size: e.size, node: { name, color: e.node.color } });
    }
  }
  const langEdges = [...langTotals.values()];
  const stars = repos.reduce((s, r) => s + r.stargazerCount, 0);
  const commits = days.reduce((s, d) => s + d.count, 0);

  const stats = {
    stars, commits, prs: u.pullRequests.totalCount, issues: u.issues.totalCount,
    contributedTo: repos.length, followers: u.followers.totalCount,
    grade: computeGrade({ commits, prs: u.pullRequests.totalCount, issues: u.issues.totalCount, stars, contributedTo: repos.length }),
  };

  const contributionWeeks = u.contributionsCollection.contributionCalendar.weeks
    .map((w) => w.contributionDays.map((d) => ({ date: d.date, count: d.contributionCount })));
  const repoList = repos.slice(0, repoListCount).map((r) => ({
    name: r.name, description: r.description || '',
    language: r.primaryLanguage?.name || null, langColor: r.primaryLanguage?.color || '#565f89',
    stars: r.stargazerCount, forks: r.forkCount, updatedAt: r.updatedAt, url: r.url,
  }));

  return {
    user: username,
    stats,
    streak: computeStreak(days),
    topRepos: pickTopRepos(repos, topReposCount),
    activity: mapActivity(events, activityCount),
    activityGraph: days.slice(-30),
    contributionWeeks,
    repoList,
    languages: topLanguages(langEdges, 5),
    trophies: [
      { kind: 'Stars', rank: stars > 200 ? 'S' : 'A' },
      { kind: 'Commit', rank: stats.grade },
      { kind: 'Repo', rank: repos.length > 30 ? 'A' : 'B' },
      { kind: 'PR', rank: stats.prs > 150 ? 'A' : 'B' },
      { kind: 'Issue', rank: 'A' },
      { kind: 'Follow', rank: stats.followers > 100 ? 'S' : 'A' },
    ],
  };
}
