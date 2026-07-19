# GitHub Dashboard Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship an interactive HTML/CSS dashboard at `<pages-root>/cards/`, generated from the existing `.github/cards` data layer, mirroring the README cards with added interactivity (hover calendar, filterable repo table, grafana 30-day graph, animated capsule header/footer).

**Architecture:** Extend `.github/cards/lib/github.mjs` `fetchAll` (additively) to expose the full-year contribution calendar and a repo list. A new `.github/cards/page/` module renders a self-contained HTML page: `template.mjs` builds the shell and inlines `styles.css` + `app.js` + a baked JSON data blob; `generate-page.mjs` orchestrates fetch → render → write. `deploy.yml` generates the page into `cv/out/cards/` inside the existing Pages artifact and gains a daily schedule.

**Tech Stack:** Node 26 ESM, zero runtime dependencies (`node:*` built-ins + global `fetch`), `node:test`. Client side: vanilla JS + CSS, no framework, no chart library. tokyonight palette.

**Design reference (concrete source):** `docs/superpowers/specs/2026-07-19-dashboard-mockup.html` — the reviewed, self-contained mockup. Its `<style>` block is the source for `styles.css`; its `<script>` rendering logic is the source for `app.js` (adapted to read baked data instead of hardcoded consts); its markup is the source for `template.mjs`. Spec: `docs/superpowers/specs/2026-07-19-github-dashboard-page-design.md`.

## Global Constraints

- **Zero runtime dependencies.** Only `node:*` built-ins and global `fetch`. Client side: vanilla JS + CSS only.
- **Backward-compatible data layer.** `fetchAll` additions are additive to the return value; the SVG generation path and its outputs must not change. All existing tests keep passing.
- **Tests run via the glob form:** `node --test '.github/cards/**/*.test.js'`. Never the directory form (broken on the `.github/` dotdir).
- **README card order** for the dashboard: about, stack, tools, stats, streak, activity-graph (30d), contribution calendar (1yr), top-repos, activity, languages, trophies, snake. One card per row, full width.
- **Defaults:** repo table shows 5 rows by default (with filter/sort/show-all); recent activity shows 5.
- **Self-contained output:** the generated `index.html` inlines all CSS and JS. External `<img>` is allowed (readme-typing-svg typing line; `snake.svg` copied in as a local file).
- **Data baked at build:** no token or API call reaches the browser.
- **English** for all code, comments, and commit messages.
- **Do not stage** `.gitignore` or `cv/src/styles/main.css` (pre-existing unrelated local changes). Commit only the files each task names.

## File Structure

- `.github/cards/lib/github.mjs` — Modify: query adds `updatedAt url`; return adds `contributionWeeks` + `repoList`; new `repoListCount` option.
- `.github/cards/fixtures/sample.json` — Modify: add `contributionWeeks` and `repoList`.
- `.github/cards/page/styles.css` — Create: tokyonight CSS (ported from mockup).
- `.github/cards/page/app.js` — Create: client rendering (ported from mockup, data-driven).
- `.github/cards/page/template.mjs` — Create: `renderPage(data, { css, js })` → full HTML string.
- `.github/cards/page/generate-page.mjs` — Create: orchestrator + `buildPageData` helper.
- `.github/cards/page/*.test.js` — Create: asset, template, and buildPageData tests.
- `.github/cards/cards.config.json` + `config.js` — Modify: add a `page` block (tagline, typing lines, repoListCount, dashboardUrl).
- `.github/workflows/deploy.yml` — Modify: generate step + copy snake + daily schedule.
- `README.md` — Modify: add a link to the dashboard.

---

### Task 1: Extend `fetchAll` — full-year calendar + repo list

**Files:**
- Modify: `.github/cards/lib/github.mjs`
- Test: `.github/cards/lib/github.test.js`

**Interfaces:**
- Consumes: existing `QUERY`, `fetchAll(username, token, opts)`.
- Produces: `fetchAll` return gains `contributionWeeks: Array<Array<{date,count}>>` (one inner array per calendar week) and `repoList: Array<{name,description,language,langColor,stars,forks,updatedAt,url}>` capped to `opts.repoListCount` (default 30). New option `repoListCount = 30`. Existing fields unchanged.

- [ ] **Step 1: Write failing tests**

Add to `.github/cards/lib/github.test.js`. Extend the first mocked graphql fixture's single repo node to include `updatedAt: '2026-01-05T00:00:00Z', url: 'https://github.com/o/r1'`, then add:

```js
test('fetchAll exposes full-year contributionWeeks and a repoList with url/updatedAt', async () => {
  const graphql = {
    data: { user: {
      contributionsCollection: { contributionCalendar: { weeks: [
        { contributionDays: [{ date: '2026-01-01', contributionCount: 2 }, { date: '2026-01-02', contributionCount: 3 }] },
        { contributionDays: [{ date: '2026-01-03', contributionCount: 0 }] },
      ] } },
      repositories: { nodes: [
        { name: 'r1', description: 'd', stargazerCount: 9, forkCount: 1,
          updatedAt: '2026-01-05T00:00:00Z', url: 'https://github.com/o/r1',
          primaryLanguage: { name: 'Go', color: '#00ADD8' },
          languages: { edges: [{ size: 100, node: { name: 'Go', color: '#00ADD8' } }] } },
      ] },
      pullRequests: { totalCount: 1 }, issues: { totalCount: 1 }, followers: { totalCount: 1 },
    } },
  };
  const fetchImpl = async (url) => ({ ok: true, json: async () => (String(url).includes('/graphql') ? graphql : []) });
  const data = await fetchAll('octocat', 'tok', { fetchImpl });
  assert.equal(data.contributionWeeks.length, 2);
  assert.deepEqual(data.contributionWeeks[0][0], { date: '2026-01-01', count: 2 });
  assert.equal(data.repoList[0].url, 'https://github.com/o/r1');
  assert.equal(data.repoList[0].updatedAt, '2026-01-05T00:00:00Z');
  assert.equal(data.repoList[0].language, 'Go');
});

test('fetchAll caps repoList at repoListCount', async () => {
  const nodes = Array.from({ length: 40 }, (_, i) => ({
    name: `r${i}`, description: '', stargazerCount: 40 - i, forkCount: 0,
    updatedAt: '2026-01-01T00:00:00Z', url: `https://github.com/o/r${i}`,
    primaryLanguage: { name: 'Go', color: '#00ADD8' }, languages: { edges: [] },
  }));
  const graphql = { data: { user: {
    contributionsCollection: { contributionCalendar: { weeks: [] } },
    repositories: { nodes }, pullRequests: { totalCount: 0 }, issues: { totalCount: 0 }, followers: { totalCount: 0 },
  } } };
  const fetchImpl = async (url) => ({ ok: true, json: async () => (String(url).includes('/graphql') ? graphql : []) });
  const data = await fetchAll('octocat', 'tok', { fetchImpl, repoListCount: 10 });
  assert.equal(data.repoList.length, 10);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test '.github/cards/lib/github.test.js'`
Expected: FAIL — `contributionWeeks` / `repoList` undefined.

- [ ] **Step 3: Implement**

In `.github/cards/lib/github.mjs`, add `updatedAt url` to the repo node selection in `QUERY`:

```js
repositories(first:100, ownerAffiliations:OWNER, orderBy:{field:STARGAZERS, direction:DESC}){
  nodes{ name description stargazerCount forkCount updatedAt url
    primaryLanguage{ name color }
    languages(first:10, orderBy:{field:SIZE, direction:DESC}){ edges{ size node{ name color } } } } }
```

Add `repoListCount = 30` to the options destructuring:

```js
export async function fetchAll(username, token, { fetchImpl = fetch, topReposCount = 5, activityCount = 5, repoListCount = 30 } = {}) {
```

Build the two new structures before the `return`:

```js
const contributionWeeks = u.contributionsCollection.contributionCalendar.weeks
  .map((w) => w.contributionDays.map((d) => ({ date: d.date, count: d.contributionCount })));
const repoList = repos.slice(0, repoListCount).map((r) => ({
  name: r.name, description: r.description || '',
  language: r.primaryLanguage?.name || null, langColor: r.primaryLanguage?.color || '#565f89',
  stars: r.stargazerCount, forks: r.forkCount, updatedAt: r.updatedAt, url: r.url,
}));
```

Add both to the returned object (after `activityGraph: days.slice(-30),`):

```js
contributionWeeks,
repoList,
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test '.github/cards/lib/github.test.js'`
Expected: PASS (new + all existing).

- [ ] **Step 5: Commit**

```bash
git add .github/cards/lib/github.mjs .github/cards/lib/github.test.js
git commit -m "feat(cards): expose full-year calendar and repo list from fetchAll"
```

---

### Task 2: Extend the fixture with calendar + repo list

**Files:**
- Modify: `.github/cards/fixtures/sample.json`
- Test: `.github/cards/page/fixture.test.js` (Create)

**Interfaces:**
- Produces: `sample.json` gains `contributionWeeks` (≥ 4 weeks of `{date,count}`) and `repoList` (≥ 8 entries with all table fields). Consumed by Tasks 3–6 tests.

- [ ] **Step 1: Write failing test**

Create `.github/cards/page/fixture.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const fx = JSON.parse(readFileSync(join(HERE, '../fixtures/sample.json'), 'utf8'));

test('fixture carries calendar weeks and a repo list for the dashboard', () => {
  assert.ok(Array.isArray(fx.contributionWeeks) && fx.contributionWeeks.length >= 4);
  assert.ok('date' in fx.contributionWeeks[0][0] && 'count' in fx.contributionWeeks[0][0]);
  assert.ok(Array.isArray(fx.repoList) && fx.repoList.length >= 8);
  for (const k of ['name', 'description', 'language', 'langColor', 'stars', 'forks', 'updatedAt', 'url'])
    assert.ok(k in fx.repoList[0], `repoList entry missing ${k}`);
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `node --test '.github/cards/page/fixture.test.js'`
Expected: FAIL — `contributionWeeks` undefined.

- [ ] **Step 3: Add the fixture data**

Add `contributionWeeks` (at least 6 weeks, each an array of 7 `{date,count}` except possibly the last) and `repoList` (the ~14 sample repos from the mockup's `REPOS` array, mapped to `{name,description,language,langColor,stars,forks,updatedAt,url}`) to `.github/cards/fixtures/sample.json`. Use the mockup's `REPOS` values for realistic data; synthesize ISO `updatedAt` dates and `url: "https://github.com/SckyzO/<name>"`.

- [ ] **Step 4: Run to verify it passes**

Run: `node --test '.github/cards/page/fixture.test.js'`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add .github/cards/fixtures/sample.json .github/cards/page/fixture.test.js
git commit -m "test(cards): extend fixture with calendar weeks and repo list"
```

---

### Task 3: Front-end assets — `styles.css` + `app.js`

**Files:**
- Create: `.github/cards/page/styles.css`
- Create: `.github/cards/page/app.js`
- Test: `.github/cards/page/assets.test.js`

**Interfaces:**
- Produces: `styles.css` (the mockup `<style>` content, verbatim minus the `.mock-note` rule). `app.js` reads baked data from `JSON.parse(document.getElementById('cards-data').textContent)` and renders every card. It must reference these element hooks used by `template.mjs`: `#aboutList #stackChips #toolChips #trophies #feed #langLegend #donut #calGrid #calMonths #activityGraph #repoBody #repoSearch #repoSort #repoToggle #snakeGrid #themeBtn #tip`.
- Consumes: baked JSON with keys `about, stack, tools, stats, streak, activityGraph, contributionWeeks, repoList, activity, languages, trophies`.

**Adaptation from the mockup** (the mockup hardcodes data; the real `app.js` must not):
- Replace the hardcoded `ABOUT/LANGS/FEED/STACK/TOOLS/TROPHIES/REPOS` consts with fields read from the parsed `cards-data` blob (`DATA.about`, `DATA.languages`, `DATA.activity`, `DATA.stack`, `DATA.tools`, `DATA.trophies`, `DATA.repoList`).
- Build the contribution calendar from `DATA.contributionWeeks` (each inner array is one column; day index = position in the week) instead of the synthetic seed loop. Compute heatmap level from the count via quartiles of the non-zero max.
- Build the activity graph from `DATA.activityGraph` (`{date,count}`; parse the `YYYY-MM-DD` date without timezone surprises — split on `-`) instead of the synthetic `pat` array.
- Map stats/streak values from `DATA.stats` / `DATA.streak` into the static markup (or render them in JS).
- Drop the JS typing effect (the header typing is an `<img>` emitted by `template.mjs`).
- Keep verbatim: donut build, repo table filter/sort/show-all (default `REPO_DEFAULT = 5`), tooltip mousemove, theme toggle, snake animation.

- [ ] **Step 1: Write failing test**

Create `.github/cards/page/assets.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const read = (f) => readFileSync(join(HERE, f), 'utf8');

test('styles.css defines the core card tokens', () => {
  const css = read('styles.css');
  assert.match(css, /\.card\s*\{/);
  assert.match(css, /--title:/);
  assert.match(css, /\[data-theme="light"\]/);
});

test('app.js is data-driven (no hardcoded sample data) and wires the hooks', () => {
  const js = read('app.js');
  assert.match(js, /getElementById\(["']cards-data["']\)/);
  assert.doesNotMatch(js, /prom-github-exporter/); // mockup sample data must be gone
  for (const id of ['calGrid', 'activityGraph', 'repoBody', 'themeBtn', 'donut'])
    assert.ok(js.includes(id), `app.js must reference #${id}`);
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `node --test '.github/cards/page/assets.test.js'`
Expected: FAIL — files do not exist.

- [ ] **Step 3: Create the assets**

Create `styles.css` from the mockup `<style>` block (drop the `.mock-note` rule). Create `app.js` per the Adaptation notes above, porting the mockup `<script>` logic. Reference file: `docs/superpowers/specs/2026-07-19-dashboard-mockup.html`.

- [ ] **Step 4: Run to verify it passes**

Run: `node --test '.github/cards/page/assets.test.js'`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add .github/cards/page/styles.css .github/cards/page/app.js .github/cards/page/assets.test.js
git commit -m "feat(cards): dashboard front-end assets (styles + data-driven app)"
```

---

### Task 4: Page template — `template.mjs`

**Files:**
- Create: `.github/cards/page/template.mjs`
- Test: `.github/cards/page/template.test.js`

**Interfaces:**
- Consumes: `buildPageData` output shape (Task 5) — an object with `about, stack, tools, stats, streak, activityGraph, contributionWeeks, repoList, activity, languages, trophies, page`.
- Produces: `renderPage(data, { css, js }) -> string` (a complete HTML document). It emits: animated capsule header (SMIL, from the mockup), hero with the `readme-typing-svg` `<img>` (lines from `data.page.typingLines`, tagline `data.page.tagline`), one card container per README-order card with the element hooks from Task 3, `<script id="cards-data" type="application/json">…</script>` holding `JSON.stringify(data)`, `<style>${css}</style>`, `<script>${js}</script>`, animated capsule footer, and a "← Back to profile README" link to `data.page.readmeUrl`.

- [ ] **Step 1: Write failing test**

Create `.github/cards/page/template.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { renderPage } from './template.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const fx = JSON.parse(readFileSync(join(HERE, '../fixtures/sample.json'), 'utf8'));
const data = { ...fx, page: { tagline: 'T', typingLines: ['A', 'B'], readmeUrl: '../', dashboardUrl: 'cards/' } };

test('renderPage inlines css/js and a valid data blob, with every card hook', () => {
  const html = renderPage(data, { css: '.card{}', js: 'console.log(1)' });
  assert.match(html, /<style>\.card\{\}<\/style>/);
  assert.match(html, /console\.log\(1\)/);
  const m = html.match(/<script id="cards-data" type="application\/json">([\s\S]*?)<\/script>/);
  assert.ok(m, 'data blob present');
  assert.doesNotThrow(() => JSON.parse(m[1]));
  for (const id of ['aboutList', 'calGrid', 'activityGraph', 'repoBody', 'donut', 'snakeGrid', 'themeBtn'])
    assert.ok(html.includes(`id="${id}"`), `missing #${id}`);
  assert.match(html, /readme-typing-svg/); // typing image in header
  assert.match(html, /<animate /); // animated capsule
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `node --test '.github/cards/page/template.test.js'`
Expected: FAIL — `template.mjs` does not exist.

- [ ] **Step 3: Implement `renderPage`**

Create `template.mjs` exporting `renderPage(data, { css, js })`. Port the mockup markup: the two animated capsule SVGs (with `<animate>`), the hero (replace the mockup's `<span id="typing">` with an `<img>` to `readme-typing-svg.demolab.com` built from `data.page.typingLines`), each `.card` with its `.ctitle` and the container hooks, then the data blob, `<style>`, `<script>`, footer, and back link. Escape the JSON blob's `<` as `<` to keep it inside the script tag safely.

- [ ] **Step 4: Run to verify it passes**

Run: `node --test '.github/cards/page/template.test.js'`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add .github/cards/page/template.mjs .github/cards/page/template.test.js
git commit -m "feat(cards): dashboard page template (renderPage)"
```

---

### Task 5: Config + orchestrator — `generate-page.mjs`

**Files:**
- Modify: `.github/cards/cards.config.json`, `.github/cards/config.js`
- Create: `.github/cards/page/generate-page.mjs`
- Test: `.github/cards/page/generate-page.test.js`

**Interfaces:**
- Consumes: `loadConfig()` (extended), `resolveToken`, `fetchAll`, `renderPage`.
- Produces: `buildPageData(apiData, cfg) -> object` (pure) merging `apiData` with `cfg.about/stack/tools` and a `page` block (`{ tagline, typingLines, readmeUrl, dashboardUrl }`). `main()` writes `<outDir>/index.html` (outDir from `process.argv[2]` or default `.github/cards/page/dist`) and copies `assets/snake.svg` into `<outDir>/snake.svg`.

- [ ] **Step 1: Write failing test**

Create `.github/cards/page/generate-page.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { buildPageData } from './generate-page.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const fx = JSON.parse(readFileSync(join(HERE, '../fixtures/sample.json'), 'utf8'));

test('buildPageData merges static config into the api data and adds a page block', () => {
  const cfg = { about: [{ icon: '👤', label: 'X', text: 'y' }], stack: [{ label: 'Go', color: '#00ADD8' }], tools: [],
    page: { tagline: 'T', typingLines: ['A'], readmeUrl: '../', dashboardUrl: 'cards/' } };
  const out = buildPageData({ ...fx, about: undefined, stack: undefined, tools: undefined }, cfg);
  assert.deepEqual(out.about, cfg.about);
  assert.equal(out.stack[0].label, 'Go');
  assert.equal(out.page.tagline, 'T');
  assert.ok(Array.isArray(out.repoList));
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `node --test '.github/cards/page/generate-page.test.js'`
Expected: FAIL — module missing.

- [ ] **Step 3: Implement config + orchestrator**

In `cards.config.json`, add a `page` block:

```json
"page": {
  "tagline": "SysAdmin & DevOps Enthusiast · Automation Lover · Monitoring Wizard · Python & Go",
  "typingLines": ["SysAdmin & DevOps Enthusiast", "Automation Lover", "Monitoring Wizard", "Python & Go Developer"],
  "readmeUrl": "../",
  "dashboardUrl": "cards/",
  "repoListCount": 30
}
```

In `config.js`, read it through (like the other optional keys):

```js
page: raw.page || { tagline: '', typingLines: [], readmeUrl: '../', dashboardUrl: 'cards/', repoListCount: 30 },
```

Create `generate-page.mjs`:

```js
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
      readmeUrl: cfg.page.readmeUrl, dashboardUrl: cfg.page.dashboardUrl } };
}

export async function main(outDir = join(HERE, 'dist')) {
  const cfg = loadConfig();
  const token = resolveToken();
  const apiData = await fetchAll(cfg.username, token, { repoListCount: cfg.page.repoListCount });
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
```

- [ ] **Step 4: Run to verify it passes**

Run: `node --test '.github/cards/page/generate-page.test.js'`
Expected: PASS. Then run the full suite: `node --test '.github/cards/**/*.test.js'` — all green.

- [ ] **Step 5: Commit**

```bash
git add .github/cards/cards.config.json .github/cards/config.js .github/cards/page/generate-page.mjs .github/cards/page/generate-page.test.js
git commit -m "feat(cards): dashboard config block and page orchestrator"
```

---

### Task 6: Deploy the dashboard inside the Pages artifact

**Files:**
- Modify: `.github/workflows/deploy.yml`

**Interfaces:**
- Consumes: `generate-page.mjs main(outDir)`. Produces the page at `cv/out/cards/index.html` inside the existing Pages artifact.

**Note:** Read the current `deploy.yml` before editing — insert the generate step after `cv/out` is staged and before the Pages artifact upload, and add the schedule to the existing `on:` block. Node is already set up for the CV build; if the build job does not set up Node, add `actions/setup-node@v7` with `node-version: 26` before the generate step.

- [ ] **Step 1: Add a daily schedule trigger**

In `deploy.yml` `on:`, add:

```yaml
  schedule:
    - cron: '0 6 * * *'   # daily — refresh the baked dashboard data
```

- [ ] **Step 2: Add the generate step**

In the `build` job, after `cv/out/` is populated and before the `upload-pages-artifact` step:

```yaml
      - name: Generate dashboard page
        env:
          CARDS_TOKEN: ${{ secrets.CARDS_TOKEN }}
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: node .github/cards/page/generate-page.mjs "$GITHUB_WORKSPACE/cv/out/cards"
```

- [ ] **Step 3: Validate the workflow locally**

Run: `node -e "require('js-yaml')" 2>/dev/null && echo yaml-ok || python3 -c "import yaml,sys; yaml.safe_load(open('.github/workflows/deploy.yml'))" && echo "deploy.yml parses"`
Expected: `deploy.yml parses` (or run `act -n -W .github/workflows/deploy.yml` for a dry run if available).

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/deploy.yml
git commit -m "ci(cards): build the dashboard page into the Pages artifact, refresh daily"
```

---

### Task 7: Link the dashboard from the README

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Add the link**

Below the hero block (after the views badge `</div>`, before the first card), add:

```markdown
<div align="center">
  <a href="https://sckyzo.github.io/SckyzO/cards/">🖥️ View the interactive dashboard →</a>
</div>
```

- [ ] **Step 2: Verify the README renders**

Run: `grep -n "interactive dashboard" README.md`
Expected: the line is present exactly once.

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs(readme): link to the interactive dashboard"
```

---

## Self-Review

- **Spec coverage:** Data strategy (Task 5 bakes data, no client token), hosting/deploy (Task 6, into `cv/out/cards/` + daily schedule), all cards incl. calendar/activity-graph/snake (Tasks 3–4), new data needs (Task 1), README link (Task 7). Covered.
- **Backward compatibility:** Task 1 is additive; existing `github.test.js` cases and SVG generation untouched — verified by running the full suite in Task 5 Step 4.
- **Type/name consistency:** `contributionWeeks`, `repoList`, `repoListCount`, `buildPageData`, `renderPage(data,{css,js})`, and the `#`-hooks list are used identically across Tasks 1, 3, 4, 5.
- **Glob test command** used in every task (never the broken directory form).
