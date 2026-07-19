import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const CONFIG_PATH = join(HERE, 'cards.config.json');
export const KNOWN_CARDS = ['header', 'about', 'stack', 'tools', 'stats', 'streak', 'activity-graph', 'top-repos', 'activity', 'trophies', 'languages', 'footer'];

// Canonical defaults for the configurable heuristics blocks. Every value here
// is the current hardcoded behavior — an unconfigured cards.config.json must
// produce byte-identical output to before these blocks existed.
export const DEFAULTS = {
  grade: {
    weights: { commits: 1, prs: 5, issues: 3, stars: 4, contributedTo: 6 },
    thresholds: { S: 8000, 'A+': 5000, A: 2500, B: 1000 },
  },
  trophies: [
    { kind: 'Stars', metric: 'stars', tiers: [{ min: 200, rank: 'S' }, { min: 0, rank: 'A' }] },
    { kind: 'Commit', metric: 'grade' },
    { kind: 'Repo', metric: 'contributedTo', tiers: [{ min: 30, rank: 'A' }, { min: 0, rank: 'B' }] },
    { kind: 'PR', metric: 'prs', tiers: [{ min: 150, rank: 'A' }, { min: 0, rank: 'B' }] },
    { kind: 'Issue', metric: 'issues', tiers: [{ min: 0, rank: 'A' }] },
    { kind: 'Follow', metric: 'followers', tiers: [{ min: 100, rank: 'S' }, { min: 0, rank: 'A' }] },
  ],
  theme: {
    name: 'tokyonight',
    palette: {
      bg: '#1a1b27', ink: '#a9b1d6', dim: '#565f89', title: '#70a5fd', accent: '#bf91f3',
      teal: '#38bdae', green: '#9ece6a', flame: '#ff9e64', gold: '#e2b714', line: '#2a2e42', white: '#ffffff',
    },
    font: "'Segoe UI',Ubuntu,'Helvetica Neue',Sans-Serif",
  },
  fetch: { repoScanLimit: 100, eventsPerPage: 30 },
  activityGraph: { days: 30 },
  languages: { excludeForks: true, count: 5 },
};

/** One-level shallow merge: keys present in `override` win, everything else falls back to `defaults`. */
function mergeShallow(defaults, override) {
  return { ...defaults, ...(override || {}) };
}

/** Merges a two-level block (e.g. `grade`) where each top-level key is itself shallow-merged over its default. */
function mergeNested(defaults, override) {
  const out = {};
  for (const key of Object.keys(defaults)) out[key] = mergeShallow(defaults[key], override?.[key]);
  return out;
}

/**
 * Normalizes the raw `theme` config value into `{name, palette, font}`.
 * Accepts a string (theme name, palette/font default to tokyonight), an
 * object (`{name?, palette?, font?}` merged over the defaults), or
 * undefined (full defaults).
 */
export function normalizeTheme(rawTheme) {
  const d = DEFAULTS.theme;
  if (typeof rawTheme === 'string') return { name: rawTheme, palette: { ...d.palette }, font: d.font };
  if (rawTheme && typeof rawTheme === 'object') {
    return {
      name: rawTheme.name || d.name,
      palette: mergeShallow(d.palette, rawTheme.palette),
      font: rawTheme.font || d.font,
    };
  }
  return { name: d.name, palette: { ...d.palette }, font: d.font };
}

export function loadConfig(env = process.env, configPath = CONFIG_PATH) {
  const raw = JSON.parse(readFileSync(configPath, 'utf8'));
  const cfg = {
    username: env.CARDS_USERNAME || raw.username,
    theme: normalizeTheme(env.CARDS_THEME || raw.theme),
    cards: (env.CARDS_CARDS ? env.CARDS_CARDS.split(',') : raw.cards).map(s => s.trim()),
    topRepos: raw.topRepos || { count: 5 },
    activity: raw.activity || { count: 5 },
    about: raw.about || [],
    stack: raw.stack || [],
    tools: raw.tools || [],
    languages: mergeShallow(DEFAULTS.languages, raw.languages),
    page: raw.page || { tagline: '', typingLines: [], readmeUrl: '../', repoListCount: 30 },
    grade: mergeNested(DEFAULTS.grade, raw.grade),
    trophies: raw.trophies || DEFAULTS.trophies,
    fetch: mergeShallow(DEFAULTS.fetch, raw.fetch),
    activityGraph: mergeShallow(DEFAULTS.activityGraph, raw.activityGraph),
  };
  if (!cfg.username) throw new Error('config: username is required');
  for (const name of cfg.cards)
    if (!KNOWN_CARDS.includes(name)) throw new Error(`config: unknown card "${name}"`);
  return cfg;
}
