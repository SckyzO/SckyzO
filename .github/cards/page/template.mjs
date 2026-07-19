// Dashboard page shell — builds the full standalone HTML document served on
// GitHub Pages. Markup is ported from
// docs/superpowers/specs/2026-07-19-dashboard-mockup.html, stripped of its
// hardcoded sample data: every card below ships an empty container, filled
// client-side by app.js from the baked #cards-data JSON blob. renderPage is
// a pure function — no I/O, no dependencies — css/js are passed in by the
// orchestrator (generate-page.mjs) and inlined verbatim.

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

// Both capsules (header + footer) share the same waving path/animation; only
// the aria-label, height and rotation differ between them.
const CAPSULE_D = 'M0,50 C160,90 320,20 480,60 C620,94 720,46 800,76 L800,0 L0,0 Z';
const CAPSULE_D_ALT = 'M0,66 C160,26 320,86 480,42 C620,74 720,90 800,52 L800,0 L0,0 Z';

function capsule({ label, height, gradientId, extraStyle = '' }) {
  return `<svg class="capsule" viewBox="0 0 800 120" preserveAspectRatio="none" role="img" aria-label="${label}" style="height:${height}px${extraStyle}">
    <defs><linearGradient id="${gradientId}" x1="0" x2="1" y1="0" y2="0">
      <stop offset="0" stop-color="#7aa2f7"/><stop offset="0.5" stop-color="#bb9af7"/><stop offset="1" stop-color="#7dcfff"/>
    </linearGradient></defs>
    <path fill="url(#${gradientId})" d="${CAPSULE_D}">
      <animate attributeName="d" dur="8s" repeatCount="indefinite"
        values="${CAPSULE_D};${CAPSULE_D_ALT};${CAPSULE_D}"/>
    </path>
  </svg>`;
}

// Cards, in README order: about, stack, tools, stats, streak, activity-graph,
// contribution calendar, top-repos, activity, languages, trophies, snake.
// Every container is empty — app.js renders its contents from DATA.
function cardsHtml() {
  return `
    <div class="card about">
      <h2 class="ctitle"><span class="em">🧠</span> About Me</h2>
      <ul id="aboutList"></ul>
    </div>

    <div class="card">
      <h2 class="ctitle"><span class="em">🧪</span> Languages &amp; Stack</h2>
      <div class="chips" id="stackChips"></div>
    </div>

    <div class="card">
      <h2 class="ctitle"><span class="em">🧰</span> Tools &amp; Environment</h2>
      <div class="chips" id="toolChips"></div>
    </div>

    <div class="card">
      <h2 class="ctitle"><span class="em">📊</span> GitHub Stats</h2>
      <div class="stats-wrap">
        <div class="stat-rows" id="statRows"></div>
        <div class="gauge" id="gauge"></div>
      </div>
    </div>

    <div class="card">
      <h2 class="ctitle"><span class="em">🔥</span> Contribution Streak</h2>
      <div class="streak-row" id="streakRow"></div>
    </div>

    <div class="card">
      <h2 class="ctitle"><span class="em">📈</span> Activity · last 30 days</h2>
      <div id="activityGraph"></div>
    </div>

    <div class="card">
      <h2 class="ctitle"><span class="em">📅</span> Contributions — last year</h2>
      <div class="cal-scroll">
        <div class="cal-months" id="calMonths"></div>
        <div class="cal" id="calGrid"></div>
      </div>
      <div class="cal-legend">
        Less
        <span class="cell" style="background:var(--cal-0)"></span>
        <span class="cell" data-lvl="1" style="background:#1f3a3a"></span>
        <span class="cell" data-lvl="2" style="background:#2e6b52"></span>
        <span class="cell" data-lvl="3" style="background:#56b168"></span>
        <span class="cell" data-lvl="4" style="background:#9ece6a"></span>
        More
      </div>
    </div>

    <div class="card">
      <h2 class="ctitle"><span class="em">📦</span> Top Repositories</h2>
      <div class="repo-toolbar">
        <input id="repoSearch" type="search" placeholder="🔍  Filter by name, description, language…" />
        <select id="repoSort">
          <option value="stars">Sort: Stars ▾</option>
          <option value="forks">Sort: Forks ▾</option>
          <option value="updated">Sort: Recently updated ▾</option>
          <option value="name">Sort: Name A→Z</option>
        </select>
      </div>
      <table class="repos">
        <thead><tr>
          <th data-sort="name">Repository</th>
          <th data-sort="language">Language</th>
          <th class="num" data-sort="stars">★</th>
          <th class="num" data-sort="forks">Forks</th>
          <th class="num" data-sort="updated">Updated</th>
        </tr></thead>
        <tbody id="repoBody"></tbody>
      </table>
      <div class="repo-more"><button id="repoToggle"></button></div>
    </div>

    <div class="card">
      <h2 class="ctitle"><span class="em">⚡</span> Recent Activity</h2>
      <ul class="feed" id="feed"></ul>
    </div>

    <div class="card">
      <h2 class="ctitle"><span class="em">🧬</span> Most Used Languages</h2>
      <div class="donut-wrap">
        <div class="donut" id="donut"></div>
        <div class="lang-legend" id="langLegend"></div>
      </div>
    </div>

    <div class="card">
      <h2 class="ctitle"><span class="em">🏆</span> Achievements</h2>
      <div class="trophies" id="trophies"></div>
    </div>

    <div class="card">
      <h2 class="ctitle"><span class="em">🐍</span> Contribution Snake</h2>
      <div class="snake-wrap"><div class="snake-grid" id="snakeGrid"></div></div>
    </div>`;
}

export function renderPage(data, { css, js }) {
  const page = data.page || {};
  const typingLines = (page.typingLines || []).map(encodeURIComponent).join(';');
  const typingSrc = `https://readme-typing-svg.demolab.com?font=Fira+Code&size=22&pause=1000&color=0FF8FC&center=true&vCenter=true&width=600&lines=${typingLines}`;
  const readmeUrl = page.readmeUrl || '#';
  const title = data.user ? `${data.user} — GitHub Dashboard` : 'GitHub Dashboard';

  // Escaping "<" keeps a "</script>" inside any string value (e.g. a repo
  // description pulled from GitHub) from breaking out of the script tag and
  // executing as HTML before app.js runs — required, do not omit.
  const dataBlob = JSON.stringify(data).replace(/</g, '\\u003c');

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
</head>
<body>
<button class="toggle" id="themeBtn" aria-label="Toggle theme">◐ <span id="themeLbl">Light</span></button>

<div class="dash">
  ${capsule({ label: 'profile header', height: 64, gradientId: 'cap-h' })}

  <div class="hero">
    <h1>Hi, I'm <code>Tom</code> 👋</h1>
    <p class="name"><code>SckyzO</code> • <code>Thomas Bourcey</code></p>
    <p class="tag"><img src="${typingSrc}" alt="${escapeHtml(page.tagline || '')}" /></p>
  </div>

  <div class="stack">${cardsHtml()}
  </div>

  ${capsule({ label: 'profile footer', height: 56, gradientId: 'cap-f', extraStyle: ';transform:rotate(180deg)' })}

  <div class="foot-links">
    <a class="back" href="${escapeHtml(readmeUrl)}">← Back to profile README</a>
    <span>tokyonight · self-hosted · data baked at build (refreshed daily)</span>
  </div>
</div>

<div class="tip" id="tip"></div>

<script id="cards-data" type="application/json">${dataBlob}</script>
<style>${css}</style>
<script>${js}</script>
</body>
</html>`;
}
