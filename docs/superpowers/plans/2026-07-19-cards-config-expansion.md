# Cards Config Expansion (Tier 1 + 2) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Move hardcoded heuristics into `cards.config.json` (JSON, zero-dep): grade weights/thresholds, trophy rules, `languages.count`, `theme` (palette + font), and fetch tuning (`fetch.repoScanLimit`, `fetch.eventsPerPage`, `activityGraph.days`).

**Architecture:** `config.js` deep-merges each new block over canonical defaults; consumers (`transform.mjs`, `github.mjs`, the SVG renderers, and the HTML template) read from config with the current hardcoded values as defaults.

**Design doc:** the audit `scratchpad/2026-07-19-cards-config-audit.md` (schema + trophy model). This plan implements Tier 1 + Tier 2 from it.

## Global Constraints

- **Zero runtime dependencies** (`node:*` + global fetch only). Format stays JSON.
- **Backward-compatible, byte-identical when unconfigured:** every new key is optional; its default equals the current hardcoded value. An unchanged `cards.config.json` (and the existing fixtures) must produce identical output, and all existing tests must pass unchanged. Deep-merge so a partial override (e.g. only `grade.thresholds.S`) keeps the other defaults.
- **`theme` accepts BOTH forms:** the current string (`"tokyonight"`) and a new object (`{name?, palette?, font?}`). String or missing → current tokyonight palette + font.
- Tests via the glob form `node --test '.github/cards/**/*.test.js'` (never the directory form).
- English for code, comments, commits. Do NOT stage `.gitignore` or `cv/src/styles/main.css`.

## Canonical defaults (single source of truth — define in code, mirror into cards.config.json for discoverability)

- `grade.weights = {commits:1, prs:5, issues:3, stars:4, contributedTo:6}`
- `grade.thresholds = {"S":8000, "A+":5000, "A":2500, "B":1000}` (else `C`)
- `languages.count = 5` (alongside existing `languages.excludeForks = true`)
- `activityGraph.days = 30`
- `fetch = {repoScanLimit:100, eventsPerPage:30}`
- `theme.palette = {bg:'#1a1b27', ink:'#a9b1d6', dim:'#565f89', title:'#70a5fd', accent:'#bf91f3', teal:'#38bdae', green:'#9ece6a', flame:'#ff9e64', gold:'#e2b714', line:'#2a2e42', white:'#ffffff'}`
- `theme.font = "'Segoe UI',Ubuntu,'Helvetica Neue',Sans-Serif"`
- `trophies` (metric + first-matching-min tiers):
  ```json
  [ {"kind":"Stars","metric":"stars","tiers":[{"min":200,"rank":"S"},{"min":0,"rank":"A"}]},
    {"kind":"Commit","metric":"grade"},
    {"kind":"Repo","metric":"contributedTo","tiers":[{"min":30,"rank":"A"},{"min":0,"rank":"B"}]},
    {"kind":"PR","metric":"prs","tiers":[{"min":150,"rank":"A"},{"min":0,"rank":"B"}]},
    {"kind":"Issue","metric":"issues","tiers":[{"min":0,"rank":"A"}]},
    {"kind":"Follow","metric":"followers","tiers":[{"min":100,"rank":"S"},{"min":0,"rank":"A"}]} ]
  ```

---

### Task 1: Config loader — new blocks with deep-merged defaults

**Files:** Modify `.github/cards/config.js`, `.github/cards/cards.config.json`; Test `.github/cards/config.test.js`.

**Interfaces — Produces:** `loadConfig()` return gains `grade`, `trophies`, `theme` (always normalized to an object `{name, palette, font}`), `fetch`, `activityGraph`, and `languages.count`. Each merges user overrides over the canonical defaults above (shallow-merge for nested objects like `grade.weights`, `grade.thresholds`, `theme.palette`, `fetch`; `trophies` replaced wholesale if provided). Existing keys unchanged.

- [ ] **Step 1: Write failing tests** in `config.test.js`:
  - defaults present when `cards.config.json` omits a block (e.g. `cfg.grade.thresholds.S === 8000`, `cfg.theme.palette.bg === '#1a1b27'`, `cfg.fetch.repoScanLimit === 100`, `cfg.languages.count === 5`, `cfg.activityGraph.days === 30`, `cfg.trophies.length === 6`).
  - `theme` string form: with a helper or by temporarily loading a raw object, assert that a raw `theme: "tokyonight"` normalizes to `{name:'tokyonight', palette:{…tokyonight}, font:…}`. (Factor the normalization so it's unit-testable, e.g. export `normalizeTheme(raw)` and `DEFAULTS`.)
  - partial override merges: a raw `grade:{thresholds:{S:9000}}` keeps `grade.weights` and `grade.thresholds.A` at defaults.
- [ ] **Step 2: Run — expect fail.** `node --test '.github/cards/config.test.js'`
- [ ] **Step 3: Implement.** Add a `DEFAULTS` object and small merge helpers to `config.js`; extend the returned `cfg`. Add `normalizeTheme(raw.theme)` accepting string|object|undefined. Add the blocks to `cards.config.json` with the canonical values (for discoverability). Keep `KNOWN_CARDS` validation intact.
- [ ] **Step 4: Run — expect pass** (new + all existing).
- [ ] **Step 5: Commit** `config.js`, `cards.config.json`, `config.test.js` — `feat(cards): configurable grade, trophies, theme, fetch limits (loader)`.

---

### Task 2: Data layer — grade, trophies, counts, fetch limits from config

**Files:** Modify `.github/cards/lib/transform.mjs`, `.github/cards/lib/github.mjs`, `.github/cards/generate.mjs`, `.github/cards/page/generate-page.mjs`; Test `.github/cards/lib/transform.test.js`, `.github/cards/lib/github.test.js`.

**Interfaces — Consumes** Task 1 config. **Produces:** `computeGrade(metrics, gradeConfig?)` (defaults to the current weights/thresholds when `gradeConfig` omitted — existing callers/tests unaffected). `fetchAll` gains options `gradeConfig`, `trophies`, `languagesCount`, `repoScanLimit`, `eventsPerPage`, `activityGraphDays` — all defaulting to current values.

- [ ] **Step 1: Write failing tests:**
  - `transform.test.js`: `computeGrade({stars:100}, {weights:{stars:100}, thresholds:{S:100,"A+":50,"A":10,"B":1}})` returns `'S'`; and `computeGrade({commits:1})` with no config still uses current defaults (returns `'C'`).
  - `github.test.js`: with a `trophies` config of one entry `{kind:'Stars',metric:'stars',tiers:[{min:5,rank:'S'},{min:0,rank:'A'}]}` and repo stars summing to ≥5, `data.trophies` equals `[{kind:'Stars',rank:'S'}]`; and a `metric:'grade'` entry yields the computed grade. Assert `languagesCount:1` caps `data.languages.length` to 1. Assert `activityGraphDays:10` caps `data.activityGraph.length` to 10.
- [ ] **Step 2: Run — expect fail.**
- [ ] **Step 3: Implement.**
  - `computeGrade(metrics, cfg = DEFAULT_GRADE)` — read weights/thresholds from `cfg`; keep the ordered S→A+→A→B→C evaluation; export `DEFAULT_GRADE`.
  - Add a pure `computeTrophies(stats, trophiesConfig)` in `transform.mjs`: for each entry, `metric:'grade'` → `stats.grade`; else pick the first tier whose `min <=` the metric value (`stars, contributedTo→repos count, prs, issues, followers`). Map `contributedTo` to the repos count.
  - `github.mjs`: thread `gradeConfig` into `computeGrade`, replace the hardcoded trophies array with `computeTrophies(...)`, wire `languagesCount` into `topLanguages`, `repoScanLimit` into the GraphQL query (use a `$repoLimit:Int!` variable — do NOT string-interpolate into the query body), `eventsPerPage` into the events URL, and `activityGraphDays` into `days.slice(-n)`.
  - `generate.mjs` and `generate-page.mjs`: pass the new options from `cfg` (`gradeConfig: cfg.grade`, `trophies: cfg.trophies`, `languagesCount: cfg.languages.count`, `repoScanLimit: cfg.fetch.repoScanLimit`, `eventsPerPage: cfg.fetch.eventsPerPage`, `activityGraphDays: cfg.activityGraph.days`).
- [ ] **Step 4: Run — expect pass** (new + all existing; the existing `fetchAll`/`computeGrade` tests must still pass unchanged since defaults match).
- [ ] **Step 5: Commit** those 4 files + 2 test files — `feat(cards): drive grade, trophies, counts and fetch limits from config`.

---

### Task 3: Theme threading into the SVG renderers

**Files:** Modify `.github/cards/lib/theme.mjs`, `.github/cards/generate.mjs`; Test `.github/cards/lib/theme.test.js`, `.github/cards/generate.test.js`.

**Interfaces — Consumes** `cfg.theme` (`{name, palette, font}`). **Produces:** `makeTheme({palette, font})` in `theme.mjs` returning a theme object shaped exactly like the exported `tokyonight` plus a font; `renderAll(data, cards, theme = tokyonight)` passes `theme` to each renderer as its 2nd arg. `text()`/`svgFrame()`/`cardTitle()` use the passed theme's font instead of the module-level `FONT` const.

- [ ] **Step 1: Write failing tests:**
  - `theme.test.js`: `makeTheme({palette:{bg:'#000000'}}).bg === '#000000'` and unset keys fall back to tokyonight (`.ink === '#a9b1d6'`); `makeTheme({font:'X'}).font === 'X'`.
  - `generate.test.js`: `renderAll(fixture, ['about'], makeTheme({palette:{bg:'#123456'}}))['about']` contains `#123456` (the frame background); with no theme arg it contains the default `#1a1b27`.
- [ ] **Step 2: Run — expect fail.**
- [ ] **Step 3: Implement.** Add `makeTheme` + keep `tokyonight` export (its values become the defaults `makeTheme` falls back to). Make `text`/`svgFrame`/`cardTitle` read `t.font` (add `font` to the tokyonight object so the default carries it). Thread `theme` through `renderAll` → `fn(data, theme)`. In `generate.mjs main()`, build `const theme = makeTheme(cfg.theme)` and pass it to `renderAll`. Templates already accept `t` as their 2nd param — no per-template signature change beyond honoring `t.font`.
- [ ] **Step 4: Run — expect pass** (existing renderer tests must still pass — default theme = current tokyonight).
- [ ] **Step 5: Commit** `theme.mjs`, `generate.mjs`, `theme.test.js`, `generate.test.js` — `feat(cards): drive the SVG card palette and font from config theme`.

---

### Task 4: Theme for the HTML dashboard (palette override)

**Files:** Modify `.github/cards/page/template.mjs`, `.github/cards/page/generate-page.mjs`; Test `.github/cards/page/template.test.js`.

**Interfaces — Consumes** `data.theme` (config `{palette, font}`) added by `buildPageData`. **Produces:** `renderPage` injects, right after the inlined `styles.css`, a `<style>:root{ --bg:…; --title:…; … }</style>` override built from `data.theme.palette` (mapping config keys to the CSS token names in styles.css: `bg→--bg/--surface? no` — map only the tokens that exist: `--bg,--ink(-soft),--dim,--title,--accent,--line` and the calendar/green where applicable) and a `font-family` override on `body`. Unspecified palette keys are omitted (styles.css default wins). The default config palette must reproduce the current look.

- [ ] **Step 1: Write failing test** in `template.test.js`: render with `data.theme = {palette:{title:'#abcdef'}, font:'MyFont'}` and assert the output contains a `:root` override with `--title:#abcdef` placed AFTER the `styles.css` block, and `MyFont` in a `font-family` rule. Render with the default config theme and assert the page still contains the tokyonight `--title:#70a5fd` (via the override or the base CSS).
- [ ] **Step 2: Run — expect fail.**
- [ ] **Step 3: Implement.** In `buildPageData` (generate-page.mjs), add `theme: cfg.theme` to the page data. In `template.mjs`, add a `paletteOverrideCss(theme)` helper mapping the config palette keys to the styles.css `:root` token names (only those that exist in styles.css), emit it as a `<style>` after the main `<style>${css}</style>`, plus a `body{font-family:…}` rule when `theme.font` is set. Escape nothing here (values are hex/font strings from config, but pass palette values through a strict `safeColor`-style guard to avoid CSS injection from a malformed config — reuse the allowlist regex).
- [ ] **Step 4: Run — expect pass.**
- [ ] **Step 5: Commit** `template.mjs`, `generate-page.mjs`, `template.test.js` — `feat(cards): apply configured palette/font to the HTML dashboard`.

---

## Self-Review

- **Coverage:** grade (T2), trophies (T2), languages.count (T2), theme palette/font for SVG (T3) and HTML (T4), fetch limits + activityGraph.days (T2), loader/defaults/back-compat (T1). All audit Tier 1 + 2 items covered.
- **Back-compat:** every task keeps existing tests passing by defaulting to current values; T1 deep-merge and `theme` string-or-object both tested; `computeGrade`'s optional 2nd arg preserves existing callers.
- **Name consistency:** `makeTheme`, `computeTrophies`, `DEFAULT_GRADE`, `gradeConfig`, `languagesCount`, `repoScanLimit`, `eventsPerPage`, `activityGraphDays`, `paletteOverrideCss` used identically across tasks.
- **Security:** T4 guards config palette values with the color allowlist before injecting into CSS.
