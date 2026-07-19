import { mkdirSync, writeFileSync, readFileSync, copyFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { loadConfig } from '../config.js';
import { resolveToken, fetchAll } from '../lib/github.mjs';
import { renderPage } from './template.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));

export function buildPageData(apiData, cfg) {
  return { ...apiData, about: cfg.about, stack: cfg.stack, tools: cfg.tools,
    page: { tagline: cfg.page.tagline, typingLines: cfg.page.typingLines,
      readmeUrl: cfg.page.readmeUrl } };
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
