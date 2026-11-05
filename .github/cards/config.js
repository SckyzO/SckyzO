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
  readme: {
    projects: [], releasesCount: 5, releasesExclude: [], languageEmoji: DEFAULT_LANGUAGE_EMOJI,
    // Badge row: [{ label, color, textColor?, icon? }], icon = a file name in assets/icons/ (Simple Icons).
    stack: [],
    // Keycap row: [{ label, color, icon, url? }], icon = a Lucide file name in assets/icons/lucide/.
    setup: [],
    // Typing terminal under the title; no lines = no terminal.svg.
    terminal: { prompt: 'user@host:~$', command: 'whoami', lines: [] },
  },
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
      terminal: mergeShallow(DEFAULTS.readme.terminal, raw.readme?.terminal),
    },
  };
  if (!cfg.username) throw new Error('config: username is required');
  validateReadme(cfg.readme);
  return cfg;
}

// readme.* keys of sections that no longer exist; same fail-loud policy as RETIRED_KEYS.
const RETIRED_README_KEYS = ['contributionsCount'];

function validateReadme(r) {
  const retired = RETIRED_README_KEYS.filter((k) => k in r);
  if (retired.length) throw new Error(`config: readme.${retired.join(', readme.')} belonged to a removed README section; delete it`);
  const isNameList = (v) => Array.isArray(v) && v.every((x) => typeof x === 'string' && x);
  for (const key of ['projects', 'releasesExclude'])
    if (!isNameList(r[key])) throw new Error(`config: readme.${key} must be a list of repo names`);
  for (const key of ['releasesCount'])
    if (!Number.isInteger(r[key]) || r[key] < 1) throw new Error(`config: readme.${key} must be a positive integer`);
  const isHex = (v) => typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v);
  if (!Array.isArray(r.stack)) throw new Error('config: readme.stack must be a list');
  r.stack.forEach((s, i) => {
    if (typeof s?.label !== 'string' || !s.label) throw new Error(`config: readme.stack[${i}].label is required`);
    for (const key of ['color', ...('textColor' in s ? ['textColor'] : [])])
      if (!isHex(s[key])) throw new Error(`config: readme.stack[${i}].${key} must be a #rrggbb colour`);
    if ('icon' in s && !/^[a-z0-9-]+$/.test(s.icon)) throw new Error(`config: readme.stack[${i}].icon must be an icon file name`);
  });
  if (!Array.isArray(r.setup)) throw new Error('config: readme.setup must be a list');
  r.setup.forEach((s, i) => {
    if (typeof s?.label !== 'string' || !s.label) throw new Error(`config: readme.setup[${i}].label is required`);
    if (!isHex(s.color)) throw new Error(`config: readme.setup[${i}].color must be a #rrggbb colour`);
    if (typeof s.icon !== 'string' || !/^[a-z0-9-]+$/.test(s.icon)) throw new Error(`config: readme.setup[${i}].icon must be an icon file name`);
    if ('url' in s && !/^https:\/\//.test(s.url)) throw new Error(`config: readme.setup[${i}].url must be an https:// link`);
  });
  const t = r.terminal;
  if (!isNameList(t.lines)) throw new Error('config: readme.terminal.lines must be a list of strings');
  for (const key of ['prompt', 'command'])
    if (typeof t[key] !== 'string' || !t[key]) throw new Error(`config: readme.terminal.${key} must be a non-empty string`);
}
