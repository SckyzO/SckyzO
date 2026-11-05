// Markdown renderers for the profile README. Everything here returns text that
// GitHub renders as real, selectable content — the whole point of moving off
// SVG cards, whose text could not be copied.

import { badgeSlug } from '../templates/badge.mjs';

export const DEFAULT_LANGUAGE_EMOJI = {
  Python: '🟨', TypeScript: '🟦', JavaScript: '🟧', Go: '🟩', Shell: '⬛',
  PHP: '🟪', C: '🟫', 'C++': '🟥', Rust: '🟫', Java: '🟥', 'Go Template': '🟪',
};
const FALLBACK_SQUARE = '⬛';
// Two cards share a row, so a GitHub description of several sentences would dwarf its neighbour.
const DESCRIPTION_MAX = 120;

export function compactNumber(n) {
  if (n < 1000) return String(n);
  return `${Math.round(n / 100) / 10}k`; // one decimal; JS drops a trailing ".0" on its own
}

export function truncate(s, max = DESCRIPTION_MAX) {
  if (s.length <= max) return s;
  const cut = s.slice(0, max);
  const space = cut.lastIndexOf(' ');
  return `${(space > 0 ? cut.slice(0, space) : cut).replace(/[\s.,;:]+$/, '')}…`;
}

export function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export const squareFor = (name, emoji) => emoji[name] || FALLBACK_SQUARE;

export function renderStatsRow({ repoCount, stars, followers, years }) {
  return [
    '<div align="center">',
    '',
    `| 📦 **${compactNumber(repoCount)}** | ⭐ **${compactNumber(stars)}** | 👥 **${compactNumber(followers)}** | 🗓️ **${years}** |`,
    '|:-:|:-:|:-:|:-:|',
    '| Repositories | Stars | Followers | Years on GitHub |',
    '',
    '</div>',
  ].join('\n');
}

/** The pie chart (assets/languages.svg, decorative) over a text legend that carries the data. */
export function renderLanguages(languages, emoji) {
  if (!languages.length) return '_No language data yet._';
  const legend = languages.map((l) => `${squareFor(l.name, emoji)} <b>${escapeHtml(l.name)}</b> ${l.pct} %`).join(' · ');
  return [
    '<p align="center"><img src="./assets/languages.svg" alt="" width="220" height="220" /></p>',
    '',
    `<p align="center">${legend}</p>`,
  ].join('\n');
}

// Inline <code> renders as a grey pill on GitHub, which turns the facts into chips.
function projectCell(p, emoji) {
  const chips = [
    ...(p.language ? [`${squareFor(p.language, emoji)} ${escapeHtml(p.language)}`] : []),
    ...(p.release ? [`🏷️ ${escapeHtml(p.release)}`] : []),
    `⭐ ${p.stars}`,
    ...(p.forks ? [`🍴 ${p.forks}`] : []), // zero forks is noise
  ].map((c) => `<code>${c}</code>`).join(' ');
  const desc = p.description ? `<br>${escapeHtml(truncate(p.description))}` : '';
  return `<td width="50%" valign="top"><a href="${escapeHtml(p.url)}"><b>${escapeHtml(p.name)}</b></a>${desc}<br>${chips}</td>`;
}

export function renderProjects(projects, emoji) {
  if (!projects.length) return '_No projects configured._';
  const rows = [];
  for (let i = 0; i < projects.length; i += 2) {
    const pair = projects.slice(i, i + 2).map((p) => projectCell(p, emoji));
    if (pair.length === 1) pair.push('<td width="50%" valign="top"></td>');
    rows.push(`<tr>${pair.join('')}</tr>`);
  }
  return ['<table>', ...rows, '</table>'].join('\n');
}

// A code block always spans the README width but its text does not, so the
// date column is pushed to about the right edge of a desktop profile (~100
// monospace columns). Narrower screens scroll the block sideways.
export const RELEASES_WIDTH = 96;

export function renderReleases(releases, width = RELEASES_WIDTH) {
  if (!releases.length) return '_No releases published yet._';
  const repoWidth = Math.max(...releases.map((r) => r.repo.length));
  const lines = releases.map((r) => {
    const left = `+ ${r.repo.padEnd(repoWidth)}  ${r.tag}`;
    const date = r.date.slice(0, 10);
    return `${left}${' '.repeat(Math.max(2, width - left.length - date.length))}${date}`;
  });
  return ['```diff', ...lines, '```'].join('\n');
}

/** Badge row for readme.stack; the images are generated into assets/badges/ by generate.mjs. */
export function renderStack(stack) {
  if (!stack.length) return '_No stack configured._';
  const badges = stack.map((s) => `  <img src="./assets/badges/${badgeSlug(s.label)}.svg" alt="${escapeHtml(s.label)}" height="28" />`);
  return ['<p align="center">', ...badges, '</p>'].join('\n');
}

/**
 * Keycap row for readme.setup (images from assets/keys/). Each key links to the tool's
 * site; without a link GitHub would wrap every image in a link to the image itself.
 */
export function renderSetup(setup) {
  if (!setup.length) return '_No setup configured._';
  const keys = setup.map((s) => {
    const img = `<img src="./assets/keys/${badgeSlug(s.label)}.svg" alt="${escapeHtml(s.label)}" height="40" />`;
    return `  ${s.url ? `<a href="${escapeHtml(s.url)}">${img}</a>` : img}`;
  });
  return ['<p align="center">', ...keys, '</p>'].join('\n');
}

export function renderReadmeSections(data, { languageEmoji: emoji = DEFAULT_LANGUAGE_EMOJI, stack = [], setup = [] } = {}) {
  return {
    stack: renderStack(stack),
    setup: renderSetup(setup),
    stats: renderStatsRow({
      repoCount: data.profile.repoCount, stars: data.stats.stars,
      followers: data.stats.followers, years: data.profile.years,
    }),
    languages: renderLanguages(data.languages, emoji),
    projects: renderProjects(data.projects, emoji),
    releases: renderReleases(data.releases),
  };
}

export function injectSections(readme, sections) {
  let out = readme;
  for (const [name, body] of Object.entries(sections)) {
    const start = `<!-- cards:${name}:start -->`;
    const end = `<!-- cards:${name}:end -->`;
    const i = out.indexOf(start);
    const j = out.indexOf(end);
    // Fail fast: silently skipping a section would leave stale data in the profile forever.
    if (i === -1 || j === -1 || j < i) throw new Error(`README is missing the ${start} … ${end} marker pair`);
    // Slicing (not String.replace) so `$&`-style sequences in generated text stay literal.
    out = `${out.slice(0, i + start.length)}\n${body}\n${out.slice(j)}`;
  }
  return out;
}
