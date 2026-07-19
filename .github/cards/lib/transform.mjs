export function computeStreak(days) {
  let total = 0, longest = 0, run = 0;
  for (const d of days) {
    total += d.count;
    if (d.count > 0) { run += 1; longest = Math.max(longest, run); }
    else run = 0;
  }
  // current streak = trailing run of non-zero days
  let current = 0;
  for (let i = days.length - 1; i >= 0 && days[i].count > 0; i--) current += 1;
  return { total, current, longest };
}

export function computeGrade({ commits = 0, prs = 0, issues = 0, stars = 0, contributedTo = 0 }) {
  // Weighted score, mapped to letter ranks. Heuristic — tune against real data.
  const score = commits * 1 + prs * 5 + issues * 3 + stars * 4 + contributedTo * 6;
  if (score > 8000) return 'S';
  if (score > 5000) return 'A+';
  if (score > 2500) return 'A';
  if (score > 1000) return 'B';
  return 'C';
}

export function topLanguages(edges, n = 5) {
  const sorted = [...edges].sort((a, b) => b.size - a.size).slice(0, n);
  const sum = sorted.reduce((s, e) => s + e.size, 0) || 1;
  return sorted.map((e) => ({
    name: e.node.name,
    color: e.node.color || '#8b949e',
    pct: Math.round((e.size / sum) * 100),
  }));
}

export function pickTopRepos(repos, n = 5) {
  return [...repos]
    .sort((a, b) => b.stargazerCount - a.stargazerCount)
    .slice(0, n)
    .map((r) => ({
      name: r.name,
      description: r.description || '',
      language: r.primaryLanguage?.name || '',
      langColor: r.primaryLanguage?.color || '#8b949e',
      stars: r.stargazerCount,
      forks: r.forkCount,
    }));
}

const EVENT_TYPE = {
  PushEvent: 'push', PullRequestEvent: 'pr', WatchEvent: 'star',
  IssuesEvent: 'issue', CreateEvent: 'repo',
};

export function mapActivity(events, n = 5) {
  const out = [];
  for (const e of events) {
    const type = EVENT_TYPE[e.type];
    if (!type) continue;
    let detail = '';
    if (type === 'push') detail = `${e.payload.commits?.length || 0} commits`;
    else if (type === 'pr') detail = `PR #${e.payload.number ?? ''}`.trim();
    else if (type === 'issue') detail = `issue #${e.payload.issue?.number ?? ''}`.trim();
    out.push({ type, repo: e.repo.name, detail, when: e.created_at || '' });
    if (out.length >= n) break;
  }
  return out;
}
