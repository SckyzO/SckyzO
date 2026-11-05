// Markdown renderers for the profile README. Everything here returns text that
// GitHub renders as real, selectable content — the whole point of moving off
// SVG cards, whose text could not be copied.

export const DEFAULT_LANGUAGE_EMOJI = {
  Python: '🟨', TypeScript: '🟦', JavaScript: '🟧', Go: '🟩', Shell: '⬛',
  PHP: '🟪', C: '🟫', 'C++': '🟥', Rust: '🟫', Java: '🟥',
};
const FALLBACK_SQUARE = '⬛';
const EMPTY_SQUARE = '⬜';
const BAR_CELLS = 10;
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

// Table cells are delimited by `|`, so a literal pipe in a repo name would split the row.
const escapeCell = (s) => String(s).replace(/\|/g, '\\|');

const squareFor = (name, emoji) => emoji[name] || FALLBACK_SQUARE;

export function languageBars(languages, emoji) {
  const labelWidth = Math.max(...languages.map((l) => l.name.length));
  const pctWidth = Math.max(...languages.map((l) => String(l.pct).length));
  return languages.map((l) => {
    // A listed language always gets one cell: an empty bar next to "4 %" reads as a rendering bug.
    const filled = l.pct > 0 ? Math.max(1, Math.round(l.pct / BAR_CELLS)) : 0;
    const bar = squareFor(l.name, emoji).repeat(filled) + EMPTY_SQUARE.repeat(BAR_CELLS - filled);
    return `${l.name.padEnd(labelWidth)}  ${bar}  ${String(l.pct).padStart(pctWidth)} %`;
  }).join('\n');
}

export function renderStatsRow({ repoCount, stars, contributions, years }) {
  return [
    '<div align="center">',
    '',
    `| 📦 **${compactNumber(repoCount)}** | ⭐ **${compactNumber(stars)}** | 🔥 **${compactNumber(contributions)}** | 🗓️ **${years}** |`,
    '|:-:|:-:|:-:|:-:|',
    '| Repositories | Stars | Contributions (last year) | Years on GitHub |',
    '',
    '</div>',
  ].join('\n');
}

export function renderLanguages(languages, emoji) {
  return ['```text', languageBars(languages, emoji), '```'].join('\n');
}

function projectCell(p, emoji) {
  const lang = p.language ? ` · ${squareFor(p.language, emoji)} ${escapeHtml(p.language)}` : '';
  const counts = [`⭐ ${p.stars}`, ...(p.forks ? [`🍴 ${p.forks}`] : [])].join(' · ');
  const desc = p.description ? `<br>${escapeHtml(truncate(p.description))}` : '';
  return `<td width="50%" valign="top"><a href="${escapeHtml(p.url)}"><b>${escapeHtml(p.name)}</b></a>${lang}${desc}<br><sub>${counts}</sub></td>`;
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

export function renderContributions(contributions) {
  if (!contributions.length) return '_No merged pull requests to other projects yet._';
  return [
    '| Repository | Merged PRs | ⭐ |',
    '|---|:-:|:-:|',
    ...contributions.map((c) => `| [${escapeCell(c.repo)}](${c.url}) | ${c.prs} | ${compactNumber(c.stars)} |`),
  ].join('\n');
}

export function renderReleases(releases) {
  if (!releases.length) return '_No releases published yet._';
  const repoWidth = Math.max(...releases.map((r) => r.repo.length));
  const tagWidth = Math.max(...releases.map((r) => r.tag.length));
  const lines = releases.map((r) => `+ ${r.repo.padEnd(repoWidth)}  ${r.tag.padEnd(tagWidth)}  ${r.date.slice(0, 10)}`);
  return ['```diff', ...lines, '```'].join('\n');
}

export function renderReadmeSections(data, emoji = DEFAULT_LANGUAGE_EMOJI) {
  return {
    stats: renderStatsRow({
      repoCount: data.profile.repoCount, stars: data.stats.stars,
      contributions: data.stats.commits, years: data.profile.years,
    }),
    languages: renderLanguages(data.languages, emoji),
    projects: renderProjects(data.projects, emoji),
    contributions: renderContributions(data.contributions),
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
