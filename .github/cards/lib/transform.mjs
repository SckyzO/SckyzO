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

// Canonical default — equal to the formula that was hardcoded before grade
// became configurable. Kept here (rather than importing config.js) so this
// module stays a self-contained pure layer with no dependency on the app's
// config loader.
export const DEFAULT_GRADE = {
  weights: { commits: 1, prs: 5, issues: 3, stars: 4, contributedTo: 6 },
  thresholds: { S: 8000, 'A+': 5000, A: 2500, B: 1000 },
};

export function computeGrade({ commits = 0, prs = 0, issues = 0, stars = 0, contributedTo = 0 }, cfg = DEFAULT_GRADE) {
  // Weighted score, mapped to letter ranks. Heuristic — tune against real data.
  const w = cfg.weights;
  const t = cfg.thresholds;
  const score = commits * (w.commits ?? 0) + prs * (w.prs ?? 0) + issues * (w.issues ?? 0)
    + stars * (w.stars ?? 0) + contributedTo * (w.contributedTo ?? 0);
  if (score > t.S) return 'S';
  if (score > t['A+']) return 'A+';
  if (score > t.A) return 'A';
  if (score > t.B) return 'B';
  return 'C';
}

// Canonical default — the 6 rules that were hardcoded in fetchAll's trophies
// array before trophies became configurable.
//
// Config contract for `trophies` entries (each `{kind, metric, tiers?}`):
//   - `kind`: display label for the trophy.
//   - `metric`: `'grade'` uses the already-computed letter grade directly and
//     needs no `tiers` (see the `metric === 'grade'` branch in
//     `computeTrophies` below); any other value looks up `stats[metric]` and
//     requires `tiers`.
//   - `tiers`: must be ordered by DESCENDING `min`. `pickTier` walks the list
//     and returns the rank of the first tier whose `min` is STRICTLY less
//     than the metric value; the final entry (lowest `min`, typically
//     `min: 0`) is the catch-all and always matches regardless of value.
export const DEFAULT_TROPHIES = [
  { kind: 'Stars', metric: 'stars', tiers: [{ min: 200, rank: 'S' }, { min: 0, rank: 'A' }] },
  { kind: 'Commit', metric: 'grade' },
  { kind: 'Repo', metric: 'contributedTo', tiers: [{ min: 30, rank: 'A' }, { min: 0, rank: 'B' }] },
  { kind: 'PR', metric: 'prs', tiers: [{ min: 150, rank: 'A' }, { min: 0, rank: 'B' }] },
  { kind: 'Issue', metric: 'issues', tiers: [{ min: 0, rank: 'A' }] },
  { kind: 'Follow', metric: 'followers', tiers: [{ min: 100, rank: 'S' }, { min: 0, rank: 'A' }] },
];

/**
 * Picks a tier's rank for `value`. Non-terminal tiers require a STRICT
 * `value > tier.min` match; the terminal (last) tier always matches — it's
 * the floor/catch-all.
 *
 * This reproduces the exact boundary of the old hardcoded rules, which used
 * strict `>` (e.g. `stars > 200 ? 'S' : 'A'`): a value equal to a tier's
 * `min` falls through rather than matching it. A naive non-strict
 * `min <= value` scan would flip that boundary for every default tier
 * (e.g. stars===200 would score 'S' instead of the old 'A').
 */
function pickTier(tiers, value) {
  for (let i = 0; i < tiers.length; i++) {
    if (i === tiers.length - 1 || value > tiers[i].min) return tiers[i].rank;
  }
  return undefined;
}

/** Pure trophy computation: config entries in, `{kind, rank}` entries out, same order. */
export function computeTrophies(stats, trophiesConfig = DEFAULT_TROPHIES) {
  return trophiesConfig.map(({ kind, metric, tiers }) => {
    if (metric === 'grade') return { kind, rank: stats.grade };
    return { kind, rank: pickTier(tiers, stats[metric] ?? 0) };
  });
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

// A PushEvent's commit count: prefer the pushed `size`, fall back to the
// commits array length. The public events API sometimes returns neither
// (empty payload), in which case the count is unknown (null), not zero — we
// then omit the "N commits" detail rather than printing a misleading "0".
function pushCount(payload = {}) {
  if (typeof payload.size === 'number') return payload.size;
  if (Array.isArray(payload.commits)) return payload.commits.length;
  return null;
}

export function mapActivity(events, n = 5) {
  const out = [];
  let pending = null; // an open push row we may still merge follow-up pushes into
  const flush = () => { if (pending) { out.push(finalizePush(pending)); pending = null; } };

  for (const e of events) {
    const type = EVENT_TYPE[e.type];
    if (!type) continue;

    if (type === 'push') {
      // Merge consecutive pushes to the same repo (GitHub shows one row, summed).
      if (pending && pending.repo === e.repo.name) {
        const c = pushCount(e.payload);
        if (c !== null) pending.count = (pending.count ?? 0) + c;
        continue; // pending keeps the most recent `when` (events are newest-first)
      }
      flush();
      if (out.length >= n) break;
      pending = { repo: e.repo.name, count: pushCount(e.payload), when: e.created_at || '' };
      continue;
    }

    flush();
    if (out.length >= n) break;
    let detail = '';
    if (type === 'pr') detail = `PR #${e.payload.number ?? ''}`.trim();
    else if (type === 'issue') detail = `issue #${e.payload.issue?.number ?? ''}`.trim();
    out.push({ type, repo: e.repo.name, detail, when: e.created_at || '' });
    if (out.length >= n) break;
  }
  if (out.length < n) flush(); // trailing open push row
  return out.slice(0, n);
}

function finalizePush(p) {
  // No detail for an unknown (empty payload) or zero commit count — "0 commits"
  // is noise, and empty payloads happen (e.g. during GitHub API incidents).
  const detail = p.count ? `${p.count} commit${p.count === 1 ? '' : 's'}` : '';
  return { type: 'push', repo: p.repo, detail, when: p.when };
}
