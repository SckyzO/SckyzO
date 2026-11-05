import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { DEFAULT_LANGUAGE_EMOJI } from './readme/markdown.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const CONFIG_PATH = join(HERE, 'cards.config.json');

// Every value here is the behaviour of an unconfigured cards.config.json.
export const DEFAULTS = {
  fetch: { repoScanLimit: 100 },
  languages: { excludeForks: true, excludeArchived: false, count: 5 },
  // Markdown README sections. `projects: []` falls back to the most-starred public repos.
  readme: { projects: [], releasesCount: 5, releasesExclude: [], contributionsCount: 5, languageEmoji: DEFAULT_LANGUAGE_EMOJI },
  // Header/footer wave gradients; one is picked per run (see templates/header.mjs pickGradient).
  capsule: {
    gradients: [
      ['#F8B195', '#F67280', '#C06C84'],
      ['#e52d27', '#b31217'],
      ['#1D976C', '#93F9B9'],
      ['#00c6ff', '#0072ff'],
      ['#2193b0', '#6dd5ed'],
      ['#EDE574', '#E1F5C4'],
      ['#7aa2f7', '#bb9af7', '#7dcfff'],
      ['#DA22FF', '#9733EE'],
      ['#f7971e', '#ffd200'],
      ['#654ea3', '#eaafc8'],
    ],
  },
};

// Keys of the retired SVG cards. Rejected rather than ignored so a stale
// config fails loudly instead of silently doing nothing.
const RETIRED_KEYS = ['cards', 'theme', 'about', 'stack', 'tools', 'page', 'grade', 'trophies', 'topRepos', 'activity', 'activityGraph'];

/** One-level shallow merge: keys present in `override` win, everything else falls back to `defaults`. */
function mergeShallow(defaults, override) {
  return { ...defaults, ...(override || {}) };
}

export function loadConfig(env = process.env, configPath = CONFIG_PATH) {
  const raw = JSON.parse(readFileSync(configPath, 'utf8'));
  const retired = RETIRED_KEYS.filter((k) => k in raw);
  if (retired.length) throw new Error(`config: ${retired.join(', ')} belonged to the removed SVG cards; delete them`);
  const cfg = {
    username: env.CARDS_USERNAME || raw.username,
    languages: mergeShallow(DEFAULTS.languages, raw.languages),
    fetch: mergeShallow(DEFAULTS.fetch, raw.fetch),
    capsule: raw.capsule || DEFAULTS.capsule,
    readme: {
      ...mergeShallow(DEFAULTS.readme, raw.readme),
      languageEmoji: mergeShallow(DEFAULTS.readme.languageEmoji, raw.readme?.languageEmoji),
    },
  };
  if (!cfg.username) throw new Error('config: username is required');
  validateReadme(cfg.readme);
  return cfg;
}

function validateReadme(r) {
  const isNameList = (v) => Array.isArray(v) && v.every((x) => typeof x === 'string' && x);
  for (const key of ['projects', 'releasesExclude'])
    if (!isNameList(r[key])) throw new Error(`config: readme.${key} must be a list of repo names`);
  for (const key of ['releasesCount', 'contributionsCount'])
    if (!Number.isInteger(r[key]) || r[key] < 1) throw new Error(`config: readme.${key} must be a positive integer`);
}
