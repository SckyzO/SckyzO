import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
export const KNOWN_CARDS = ['header', 'about', 'stack', 'tools', 'stats', 'streak', 'activity-graph', 'top-repos', 'activity', 'trophies', 'languages', 'footer'];

export function loadConfig(env = process.env) {
  const raw = JSON.parse(readFileSync(join(HERE, 'cards.config.json'), 'utf8'));
  const cfg = {
    username: env.CARDS_USERNAME || raw.username,
    theme: env.CARDS_THEME || raw.theme || 'tokyonight',
    cards: (env.CARDS_CARDS ? env.CARDS_CARDS.split(',') : raw.cards).map(s => s.trim()),
    topRepos: raw.topRepos || { count: 5 },
    activity: raw.activity || { count: 5 },
    about: raw.about || [],
    stack: raw.stack || [],
    tools: raw.tools || [],
  };
  if (!cfg.username) throw new Error('config: username is required');
  for (const name of cfg.cards)
    if (!KNOWN_CARDS.includes(name)) throw new Error(`config: unknown card "${name}"`);
  return cfg;
}
