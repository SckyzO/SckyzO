import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { loadConfig } from './config.js';
import { resolveToken, fetchAll } from './lib/github.mjs';
import { renderHeader, renderFooter, pickGradient } from './templates/header.mjs';
import { renderReadmeSections, injectSections } from './readme/markdown.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const README_PATH = join(HERE, '../../README.md');
const ASSETS_DIR = join(HERE, '../../assets');

/** Rewrites only the marker-delimited sections of the README; the hand-written rest stays untouched. */
export function updateReadme(path, data, languageEmoji) {
  const before = readFileSync(path, 'utf8');
  const after = injectSections(before, renderReadmeSections(data, languageEmoji));
  writeFileSync(path, after, 'utf8');
  return after !== before;
}

/** One gradient for both waves, so header and footer always match within a run. */
export function renderWaves(gradients, now = Date.now()) {
  const stops = pickGradient(gradients, now);
  return { header: renderHeader(stops), footer: renderFooter(stops) };
}

export async function main() {
  const cfg = loadConfig();
  const data = await fetchAll(cfg.username, resolveToken(), {
    excludeForks: cfg.languages.excludeForks, excludeArchived: cfg.languages.excludeArchived,
    languagesCount: cfg.languages.count, repoScanLimit: cfg.fetch.repoScanLimit,
    projects: cfg.readme.projects, releasesCount: cfg.readme.releasesCount,
    releasesExclude: cfg.readme.releasesExclude, contributionsCount: cfg.readme.contributionsCount,
  });
  mkdirSync(ASSETS_DIR, { recursive: true });
  for (const [name, svg] of Object.entries(renderWaves(cfg.capsule.gradients))) {
    writeFileSync(join(ASSETS_DIR, `${name}.svg`), svg, 'utf8');
    console.log(`wrote assets/${name}.svg (${svg.length} bytes)`);
  }
  const changed = updateReadme(README_PATH, data, cfg.readme.languageEmoji);
  console.log(`README.md sections ${changed ? 'updated' : 'unchanged'}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((e) => { console.error(e); process.exit(1); });
}
