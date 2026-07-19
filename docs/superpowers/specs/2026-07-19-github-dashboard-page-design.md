# GitHub Dashboard Page — Design

**Status:** design approved (mockup validated; ready for implementation plan)
**Date:** 2026-07-19
**Mockup:** self-contained HTML prototype with sample data (single-column, tokyonight)

## Goal

Add a rich, interactive HTML/CSS dashboard page hosted on GitHub Pages, as a
companion to the README profile. The README keeps its self-hosted SVG cards
(GitHub sanitizes README HTML, so graphical cards there can only be SVG). The
Pages site has no such limit, so the dashboard adds what SVG cannot do: a
hover-tooltip contribution calendar, a filterable/sortable repository table,
an interactive language donut, and a light/dark toggle.

The dashboard mirrors the README's visual language — same tokyonight palette,
same capsule header/footer, the same cards in the same order — and layers
interactivity on top. It is a superset of the README, not a replacement.

## Scope

**In scope**

- A standalone page served at `<pages-root>/cards/` (e.g. `sckyzo.github.io/SckyzO/cards/`).
- Capsule header (matching `assets/header.svg`) plus the README hero: "Hi, I'm Tom",
  name line, and the animated typing line via `readme-typing-svg`
  (DenverCoder1) — same as the README. External `<img>` is fine on Pages.
- Cards, in README order: About (single-column list), Languages & Stack, Tools &
  Environment, GitHub Stats (labeled rows + rank ring, HTML port of the SVG card),
  Contribution Streak (full-width, SVG style), Activity · last 30 days (grafana
  area chart), Contribution calendar (last year), Top Repositories (5 by default,
  filter + sort + show-all), Recent Activity (5), Most Used Languages (donut),
  Achievements (trophies), Contribution Snake (embeds `assets/snake.svg`).
- Animated capsule header and footer (waving SVG, matching `assets/header.svg` /
  `assets/footer.svg` shape; the animation reuses the capsule-render "waving"
  motion locally via SMIL).
- Light/dark theme toggle; tokyonight in both themes.
- A "← Back to profile README" link, and a link from the README to the dashboard.

**Out of scope (for now)**

- Live client-side API calls (see Data strategy — data is baked at build).
- Localizing the typing header (it stays on `readme-typing-svg`, as in the README).
- Any change to the existing SVG card generator's output.

## Layout

One card per row, full width, stacked vertically — the same rhythm as the
README, which the maintainer prefers over a multi-column grid ("1 box par ligne").

```
[ capsule header wave ]
   Hi, I'm Tom 👋 · SckyzO • Thomas Bourcey · «typing» line · views
────────────────────────────────────────────────
🧠  About Me                 (config bullets)
🧪  Languages & Stack        (colored chips)
🧰  Tools & Environment      (colored chips)
📊  GitHub Stats             (rank gauge + 6 metrics incl. followers)
🔥  Contribution Streak      (total / current / longest, full width, SVG style)
📈  Activity · last 30 days  (grafana area chart: gradient fill, grid, X/Y axes)
📅  Contributions — last year(53-week heatmap, month labels, per-day tooltip)
📦  Top Repositories         (table, top 5, filter + sortable headers + show-all)
⚡  Recent Activity          (5 events)
🧬  Most Used Languages       (conic-gradient donut + % legend, hover)
🏆  Achievements             (trophy grid)
🐍  Contribution Snake        (embeds assets/snake.svg)
[ capsule footer wave ]   ← Back to profile README
```

The header's typing line uses the `readme-typing-svg` image, exactly as the
README does. The contribution calendar fills column-major (each column is one
week, Sunday→Saturday top to bottom) so month labels line up with the week
columns they head.

Theme toggle is a small floating button (top-right), so it never disturbs the
card rhythm.

## Architecture

### Data strategy — baked at build

The CI job runs the existing data layer (`.github/cards/lib/github.mjs`
`fetchAll`) with `CARDS_TOKEN`, and inlines the result into the generated page
as a JSON blob. No token ever reaches the browser, there are no client-side
rate limits, and the page loads instantly. This matches the project's security
posture (never expose secrets through a public surface) and reuses the exact
data layer that already feeds the SVG cards — one source of truth.

Freshness equals the last build. The README SVG cards remain the near-real-time
surface (their own 6-hour cron); the dashboard is the richer, slightly less
real-time companion.

### Hosting and deployment

GitHub allows one Pages site per repository, and `deploy.yml` already publishes
`cv/out/` there via `actions/deploy-pages`. The dashboard therefore lives as a
sub-path of that same site, not as a second Pages deployment.

- `deploy.yml`'s build job gains one lightweight step (no Chromium): generate
  the dashboard into `cv/out/cards/`, so it ships inside the existing Pages
  artifact. The step also copies `assets/snake.svg` into `cv/out/cards/` so the
  snake card can reference it with a relative `<img>` (the capsule header/footer
  are small enough to inline directly in the page).
- To refresh the baked data, `deploy.yml` gains a daily `schedule` trigger. A
  once-daily CV rebuild is cheap, and keeps the dashboard within 24h of live.

This is the only coupling between the dashboard and the CV pipeline. The
dashboard's code and build stay isolated under `.github/cards/page/`.

### Code home

Extend the existing generator rather than starting a parallel project:

```
.github/cards/
├── lib/github.mjs          # fetchAll — extended (see New data needs), backward-compatible
├── lib/transform.mjs       # reused as-is (streak, grade, top languages, …)
├── lib/theme.mjs           # tokyonight palette reused for the page's CSS tokens
└── page/
    ├── generate-page.mjs   # orchestrator: fetchAll → inline data → write index.html
    ├── template.mjs        # HTML shell (header, cards, footer) as template strings
    ├── styles.css.mjs      # tokyonight CSS tokens (dark + light), card styles
    ├── app.js.mjs          # client JS: calendar, donut, repo table, tooltip, toggle
    └── page.test.js        # node:test — renders from fixture, asserts structure
```

The page is emitted self-contained (CSS and JS inlined) for a single robust
artifact, consistent with the repo's no-build-framework approach: pure Node ESM
to generate, vanilla JS + CSS in the browser, zero runtime dependencies. Charts
are hand-rolled (CSS conic-gradient donut, CSS-grid heatmap), no chart library.

## New data needs

Smaller than they first appear: `fetchAll`'s GraphQL query already fetches the
full-year contribution calendar and up to 100 repositories. Both additions are
purely additive to the return value, so the SVG generation path is unchanged
(backward-compatible).

1. **Contribution calendar** — the query already selects
   `contributionsCollection.contributionCalendar.weeks[].contributionDays[]
   { date contributionCount }`, but the return only exposes the last 30 days
   (`activityGraph: days.slice(-30)`). Add the full-year data to the return
   (e.g. `contributionWeeks`). Heatmap levels are computed client-side from the
   counts (quartiles), so no query change is needed here.
2. **Repository list** — the query already selects up to 100 repos with
   `name description stargazerCount forkCount primaryLanguage{name color}`.
   It lacks only `updatedAt` and `url`; add those two fields, and expose a
   capped `repoList` (~30) in the return so the table can filter/sort/show-all.

## Testing

- `page/page.test.js` renders the page from `fixtures/sample.json` (extended
  with calendar + repo-list fields) and asserts: every expected card is present,
  the data blob is valid JSON, the repo table defaults to 5 rows, and the
  header/footer capsules render. Run via the existing glob command
  `node --test '.github/cards/**/*.test.js'`.
- `fetchAll` additions get unit coverage in `lib/github.test.js` against a
  mocked `fetchImpl` (the existing pattern), including the calendar shape and
  the repo-count parameter.

## Resolved design decisions

- Calendar palette: GitHub-style green ramp (as in the mockup).
- Repo table: top 5 by default, with a "Show all" expansion and live filter/sort.
- The dashboard embeds the contribution snake (`assets/snake.svg`), after the
  trophies, matching README order.
- The header keeps the animated `readme-typing-svg` line, as in the README.
