import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { loadConfig } from './config.js';
import { resolveToken, fetchAll } from './lib/github.mjs';
import { renderHeader, renderFooter, pickGradient } from './templates/header.mjs';
import { renderBadge, renderValueBadge, badgeSlug, iconPathsFrom } from './templates/badge.mjs';
import { renderTerminal } from './templates/terminal.mjs';
import { renderDivider } from './templates/divider.mjs';
import { renderLanguagePie } from './templates/languages.mjs';
import { renderReadmeSections, injectSections, squareFor } from './readme/markdown.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const README_PATH = join(HERE, '../../README.md');
const ASSETS_DIR = join(HERE, '../../assets');
const ICONS_DIR = join(ASSETS_DIR, 'icons');

// Served through <picture> by prefers-color-scheme; pastel waves need more opacity on white.
const WAVE_OPACITY = { dark: 0.4, light: 0.6 };
const FOLLOWERS_COLOR = '#8A2BE2';

/** Rewrites only the marker-delimited sections of the README; the hand-written rest stays untouched. */
export function updateReadme(path, data, options) {
  const before = readFileSync(path, 'utf8');
  const after = injectSections(before, renderReadmeSections(data, options));
  writeFileSync(path, after, 'utf8');
  return after !== before;
}

/** One gradient for both waves, so header and footer always match within a run. */
export function renderWaves(gradients, now = Date.now()) {
  const stops = pickGradient(gradients, now);
  const out = {};
  for (const [theme, opacity] of Object.entries(WAVE_OPACITY)) {
    out[`header-${theme}.svg`] = renderHeader(stops, 'header', { opacity });
    out[`footer-${theme}.svg`] = renderFooter(stops, { opacity });
  }
  return out;
}

/**
 * Every generated image, keyed by its path under assets/. Pure apart from
 * `readIcon(name)`, which returns the source of assets/icons/<name>.svg.
 */
export function renderAssets(cfg, data, { now = Date.now(), readIcon }) {
  const stops = pickGradient(cfg.capsule.gradients, now);
  const assets = {
    ...renderWaves(cfg.capsule.gradients, now),
    'divider.svg': renderDivider(stops),
    'languages.svg': renderLanguagePie(data.languages, (name) => squareFor(name, cfg.readme.languageEmoji)),
    'badges/followers.svg': renderValueBadge({ label: 'Followers', value: data.stats.followers, color: FOLLOWERS_COLOR }),
  };
  for (const s of cfg.readme.stack) {
    const iconPaths = s.icon ? iconPathsFrom(readIcon(s.icon)) : [];
    assets[`badges/${badgeSlug(s.label)}.svg`] = renderBadge({ label: s.label, color: s.color, textColor: s.textColor, iconPaths });
  }
  const t = cfg.readme.terminal;
  if (t.lines.length) assets['terminal.svg'] = renderTerminal({ ...t, accent: stops[0] });
  return assets;
}

export async function main() {
  const cfg = loadConfig();
  const data = await fetchAll(cfg.username, resolveToken(), {
    excludeForks: cfg.languages.excludeForks, excludeArchived: cfg.languages.excludeArchived,
    languagesCount: cfg.languages.count, repoScanLimit: cfg.fetch.repoScanLimit,
    projects: cfg.readme.projects, releasesCount: cfg.readme.releasesCount,
    releasesExclude: cfg.readme.releasesExclude,
  });
  const readIcon = (name) => readFileSync(join(ICONS_DIR, `${name}.svg`), 'utf8');
  for (const [path, svg] of Object.entries(renderAssets(cfg, data, { readIcon }))) {
    const target = join(ASSETS_DIR, path);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, svg, 'utf8');
    console.log(`wrote assets/${path} (${svg.length} bytes)`);
  }
  const changed = updateReadme(README_PATH, data, { languageEmoji: cfg.readme.languageEmoji, stack: cfg.readme.stack });
  console.log(`README.md sections ${changed ? 'updated' : 'unchanged'}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((e) => { console.error(e); process.exit(1); });
}
