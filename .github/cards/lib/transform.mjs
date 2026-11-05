export function topLanguages(edges, n = 5) {
  const sorted = [...edges].sort((a, b) => b.size - a.size).slice(0, n);
  const sum = sorted.reduce((s, e) => s + e.size, 0) || 1;
  return sorted.map((e) => ({ name: e.node.name, pct: Math.round((e.size / sum) * 100) }));
}

// --- README data ---
// Private repos are excluded from every README list: the PAT can read them,
// but the profile is public and must never leak their names.

const toProject = (r) => ({
  name: r.name, url: r.url, description: r.description || '',
  language: r.primaryLanguage?.name || null, stars: r.stargazerCount, forks: r.forkCount,
});

/** Curated `names` win (in that order); without a list, the most-starred public non-fork repos. */
export function pickProjects(repos, names = [], fallbackCount = 4) {
  if (!names.length) {
    return repos.filter((r) => !r.isFork && !r.isPrivate)
      .sort((a, b) => b.stargazerCount - a.stargazerCount)
      .slice(0, fallbackCount).map(toProject);
  }
  const byName = new Map(repos.map((r) => [r.name, r]));
  return names.map((name) => {
    const r = byName.get(name);
    if (!r) throw new Error(`readme.projects: repo "${name}" not found among the scanned repos`);
    if (r.isPrivate) throw new Error(`readme.projects: repo "${name}" is private and cannot be shown on the profile`);
    return toProject(r);
  });
}

export function latestReleases(repos, n = 5, exclude = []) {
  const hidden = new Set(exclude);
  return repos
    .filter((r) => r.latestRelease && !r.isFork && !r.isPrivate && !hidden.has(r.name))
    .map((r) => ({ repo: r.name, tag: r.latestRelease.tagName, url: r.latestRelease.url, date: r.latestRelease.publishedAt }))
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, n);
}

/** Groups PR search hits by target repo; most PRs first, ties broken by the repo's stars. */
export function externalContributions(prNodes, n = 5) {
  const byRepo = new Map();
  for (const pr of prNodes) {
    const repo = pr?.repository;
    if (!repo) continue;
    const entry = byRepo.get(repo.nameWithOwner) || { repo: repo.nameWithOwner, url: repo.url, prs: 0, stars: repo.stargazerCount };
    entry.prs += 1;
    byRepo.set(repo.nameWithOwner, entry);
  }
  return [...byRepo.values()].sort((a, b) => b.prs - a.prs || b.stars - a.stars).slice(0, n);
}

export function yearsSince(iso, now = Date.now()) {
  const from = new Date(iso);
  const to = new Date(now);
  let years = to.getUTCFullYear() - from.getUTCFullYear();
  const beforeAnniversary = to.getUTCMonth() < from.getUTCMonth()
    || (to.getUTCMonth() === from.getUTCMonth() && to.getUTCDate() < from.getUTCDate());
  if (beforeAnniversary) years -= 1;
  return years;
}
