import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { loadConfig } from './config.js';
import { resolveToken, fetchAll } from './lib/github.mjs';
import { tokyonight, makeTheme } from './lib/theme.mjs';
import { renderStats } from './templates/stats.mjs';
import { renderStreak } from './templates/streak.mjs';
import { renderTopRepos } from './templates/top-repos.mjs';
import { renderActivity } from './templates/activity.mjs';
import { renderTrophies } from './templates/trophies.mjs';
import { renderLanguages } from './templates/languages.mjs';
import { renderAbout } from './templates/about.mjs';
import { renderActivityGraph } from './templates/activity-graph.mjs';
import { renderHeader, renderFooter } from './templates/header.mjs';
import { renderStack, renderTools } from './templates/stack.mjs';

const RENDERERS = {
  stats: renderStats, streak: renderStreak, 'top-repos': renderTopRepos,
  activity: renderActivity, trophies: renderTrophies, languages: renderLanguages,
  about: renderAbout, 'activity-graph': renderActivityGraph,
  header: renderHeader, footer: renderFooter,
  stack: renderStack, tools: renderTools,
};

export function renderAll(data, cards, theme = tokyonight) {
  const out = {};
  for (const name of cards) {
    const fn = RENDERERS[name];
    if (fn) out[name] = fn(data, theme);
  }
  return out;
}

export async function main() {
  const cfg = loadConfig();
  const token = resolveToken();
  const data = await fetchAll(cfg.username, token, {
    topReposCount: cfg.topRepos.count, activityCount: cfg.activity.count, excludeForks: cfg.languages.excludeForks,
    gradeConfig: cfg.grade, trophies: cfg.trophies, languagesCount: cfg.languages.count,
    repoScanLimit: cfg.fetch.repoScanLimit, eventsPerPage: cfg.fetch.eventsPerPage, activityGraphDays: cfg.activityGraph.days,
  });
  // about/stack/tools are static config, not API data — fetchAll never populates them.
  Object.assign(data, { about: cfg.about, stack: cfg.stack, tools: cfg.tools });
  const theme = makeTheme(cfg.theme);
  const svgs = renderAll(data, cfg.cards, theme);
  const outDir = join(dirname(fileURLToPath(import.meta.url)), '../../assets');
  mkdirSync(outDir, { recursive: true });
  for (const [name, svg] of Object.entries(svgs)) {
    writeFileSync(join(outDir, `${name}.svg`), svg, 'utf8');
    console.log(`wrote assets/${name}.svg (${svg.length} bytes)`);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((e) => { console.error(e); process.exit(1); });
}
