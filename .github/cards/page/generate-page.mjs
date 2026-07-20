import { mkdirSync, writeFileSync, readFileSync, copyFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { loadConfig, DEFAULTS } from '../config.js';
import { resolveToken, fetchAll } from '../lib/github.mjs';
import { renderPage } from './template.mjs';
import { pickGradient } from '../templates/header.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));

// Reduces cfg.theme to only what the user actually changed from the
// defaults. The dashboard's own styles.css already renders the default
// (tokyonight) look, so injecting the full default palette would fight it
// on token names that don't line up 1:1 (e.g. config `bg` vs styles.css
// `--bg`/`--surface`/`--card`) and visibly change unconfigured output.
// Diffing to only the changed keys keeps an unconfigured page untouched.
function themeDiff(theme) {
  const cfgPalette = theme?.palette || {};
  const palette = {};
  for (const key of Object.keys(DEFAULTS.theme.palette)) {
    const value = cfgPalette[key];
    if (value !== undefined && value !== DEFAULTS.theme.palette[key]) palette[key] = value;
  }
  const font = theme?.font && theme.font !== DEFAULTS.theme.font ? theme.font : null;
  return { palette, font };
}

export function buildPageData(apiData, cfg) {
  // Resolved here (not inside renderPage) so renderPage stays a pure
  // function of `data` — no Date.now() in the template. Same
  // pickGradient() the README's generate.mjs uses, so both the dashboard
  // and the README rotate through the same palette set, just picked
  // independently per build.
  const gradients = cfg.capsule?.gradients || DEFAULTS.capsule.gradients;
  return { ...apiData, about: cfg.about, stack: cfg.stack, tools: cfg.tools,
    page: { tagline: cfg.page.tagline, typingLines: cfg.page.typingLines,
      readmeUrl: cfg.page.readmeUrl },
    theme: themeDiff(cfg.theme),
    capsuleStops: pickGradient(gradients, Date.now()) };
}

export async function main(outDir = join(HERE, 'dist')) {
  const cfg = loadConfig();
  const token = resolveToken();
  const apiData = await fetchAll(cfg.username, token, {
    repoListCount: cfg.page.repoListCount, excludeForks: cfg.languages.excludeForks,
    gradeConfig: cfg.grade, trophies: cfg.trophies, languagesCount: cfg.languages.count,
    repoScanLimit: cfg.fetch.repoScanLimit, eventsPerPage: cfg.fetch.eventsPerPage, activityGraphDays: cfg.activityGraph.days,
  });
  const data = buildPageData(apiData, cfg);
  const css = readFileSync(join(HERE, 'styles.css'), 'utf8');
  const js = readFileSync(join(HERE, 'app.js'), 'utf8');
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, 'index.html'), renderPage(data, { css, js }), 'utf8');
  const snake = join(HERE, '../../../assets/snake.svg');
  if (existsSync(snake)) copyFileSync(snake, join(outDir, 'snake.svg'));
  console.log(`wrote ${join(outDir, 'index.html')}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main(process.argv[2]).catch((e) => { console.error(e); process.exit(1); });
}
