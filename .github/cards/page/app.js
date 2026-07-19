// Dashboard client script — renders every card from the JSON blob baked at
// build time by generate-page.mjs. No token, no network call, no hardcoded
// sample data: everything below is sourced from DATA.
const DATA = JSON.parse(document.getElementById('cards-data').textContent);
const $ = (s) => document.querySelector(s);
const fmt = (n) => (n ?? 0).toLocaleString('en-US');

// Defensive helpers — this page is public (GitHub Pages) and several DATA
// fields originate from GitHub-hosted content other users control (repo
// names/descriptions, public-event payloads). Every such value is routed
// through one of these before it reaches innerHTML, a style="" color, or an
// href, rather than being trusted at each call site individually.
function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}
function safeColor(c) {
  const v = String(c ?? '');
  return /^#[0-9a-fA-F]{3,8}$/.test(v) || /^[a-zA-Z]+$/.test(v) ? v : '#565f89';
}
function safeUrl(u) {
  const v = String(u ?? '');
  return /^https?:\/\//.test(v) ? v : '#';
}

// About
$('#aboutList').innerHTML = (DATA.about || [])
  .map((a) => `<li><span class="ic">${escapeHtml(a.icon)}</span><b>${escapeHtml(a.label)}:</b> ${escapeHtml(a.text)}</li>`)
  .join('');

// Stack / tools chips
const chip = (c) => `<span class="chip" style="background:${safeColor(c.color)};color:${safeColor(c.fg || '#fff')}">${escapeHtml(c.label)}</span>`;
$('#stackChips').innerHTML = (DATA.stack || []).map(chip).join('');
$('#toolChips').innerHTML = (DATA.tools || []).map(chip).join('');

// Trophies
const rkClass = (r) => (r === 'A+' ? 'Ap' : r);
$('#trophies').innerHTML = (DATA.trophies || [])
  .map((t) => `<div class="trophy"><div class="rk ${escapeHtml(rkClass(t.rank))}">${escapeHtml(t.rank)}</div><div class="kd">${escapeHtml(t.kind)}</div></div>`)
  .join('');

// Recent activity feed
const FEED_ICON = { push: '🚀', pr: '🔀', star: '⭐', issue: '🐛', repo: '✨' };
const FEED_VERB = { push: 'Pushed', pr: 'Merged', star: 'Starred', issue: 'Opened', repo: 'Created repo' };
function timeAgo(iso) {
  if (!iso) return '';
  const diffMs = Math.max(0, Date.now() - new Date(iso).getTime());
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return 'yesterday';
  if (days < 30) return `${days}d ago`;
  return `${Math.round(days / 30)}mo ago`;
}
$('#feed').innerHTML = (DATA.activity || [])
  .map((e) => {
    const ic = FEED_ICON[e.type] || '•';
    const detail = [FEED_VERB[e.type] || '', escapeHtml(e.detail || '')].filter(Boolean).join(' ');
    return `<li><span class="fic">${ic}</span><div><div><span class="repo">${escapeHtml(e.repo)}</span></div><div class="ago">${detail} · ${timeAgo(e.when)}</div></div></li>`;
  })
  .join('');

// Languages donut + legend
(function renderDonut() {
  const LANGS = DATA.languages || [];
  let acc = 0;
  const stops = [];
  for (const l of LANGS) {
    stops.push(`${safeColor(l.color)} ${acc}% ${acc + l.pct}%`);
    acc += l.pct;
  }
  $('#donut').style.background = `conic-gradient(${stops.join(',')})`;
  $('#langLegend').innerHTML = LANGS
    .map((l) => `<div class="row"><span class="dot" style="background:${safeColor(l.color)}"></span>${escapeHtml(l.name)}<span class="pct">${l.pct}%</span></div>`)
    .join('');
})();

// Stats + streak — the template ships empty containers (#statRows, #gauge,
// #streakRow); values are rendered here from DATA.stats / DATA.streak.
(function renderStats() {
  const s = DATA.stats || {};
  const rows = [
    ['⭐', 'Total Stars Earned', s.stars],
    ['⬆', 'Total Commits', s.commits],
    ['⎇', 'Total PRs', s.prs],
    ['◎', 'Total Issues', s.issues],
    ['◈', 'Contributed to', s.contributedTo],
    ['👥', 'Followers', s.followers],
  ];
  const statRows = $('#statRows');
  if (statRows) {
    statRows.innerHTML = rows
      .map(([ic, lbl, val]) => `<div class="r"><span class="ic">${ic}</span><span class="lbl">${lbl}</span><span class="val">${fmt(val)}</span></div>`)
      .join('');
  }
  const gauge = $('#gauge');
  if (gauge) {
    // No raw percentage ships in DATA.stats — map the letter grade to an
    // illustrative fill level for the gauge ring (same visual role as the
    // mockup's fixed --v:82).
    const GRADE_PCT = { S: 95, 'A+': 88, A: 75, B: 60, C: 40 };
    gauge.style.setProperty('--v', GRADE_PCT[s.grade] ?? 50);
    gauge.innerHTML = `<div><span>${escapeHtml(s.grade || '')}</span><small>RANK</small></div>`;
  }
})();

(function renderStreak() {
  const streakRow = $('#streakRow');
  if (!streakRow) return;
  const s = DATA.streak || {};
  streakRow.innerHTML = `
    <div class="s"><div class="big">${fmt(s.total)}</div><div class="lbl">Total Contributions</div></div>
    <div class="s"><div class="big cur">${fmt(s.current)}</div><div class="lbl">Current Streak</div></div>
    <div class="s"><div class="big">${fmt(s.longest)}</div><div class="lbl">Longest Streak</div></div>`;
})();

// Calendar — columns = weeks (each a vertical Sun→Sat, matching
// grid-auto-flow:column). Built from DATA.contributionWeeks (one inner array
// per week); the day's row is its index within that week's array. Heatmap
// level is bucketed by quartiles of the max count seen across the year.
const tip = $('#tip');
(function renderCalendar() {
  const weeks = DATA.contributionWeeks || [];
  const maxCount = Math.max(0, ...weeks.flat().map((d) => d.count));
  const q = maxCount / 4;
  const levelFor = (c) => (c <= 0 ? 0 : c <= q ? 1 : c <= q * 2 ? 2 : c <= q * 3 ? 3 : 4);
  const MO = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const dateOf = (iso) => {
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(y, m - 1, d);
  };
  let cells = '';
  let months = '';
  let lastMonth = -1;
  for (const week of weeks) {
    const first = week[0];
    const month = first ? dateOf(first.date).getMonth() : lastMonth;
    months += `<span>${first && month !== lastMonth ? MO[month] : ''}</span>`;
    lastMonth = month;
    for (let row = 0; row < 7; row++) {
      const day = week[row];
      if (!day) {
        cells += `<span class="cell" style="visibility:hidden"></span>`;
        continue;
      }
      const lvl = levelFor(day.count);
      const ds = dateOf(day.date).toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
      const tipText = `${day.count} contribution${day.count === 1 ? '' : 's'} · ${ds}`;
      cells += `<span class="cell" data-lvl="${lvl}" data-tip="${escapeHtml(tipText)}"></span>`;
    }
  }
  $('#calGrid').innerHTML = cells;
  $('#calMonths').innerHTML = months;
})();

// Activity graph — last 30 days (grafana-style area chart; theme-reactive via
// CSS vars in style=""). Built from DATA.activityGraph ({date,count}); dates
// are parsed by splitting on "-" to avoid UTC/local timezone shifts.
(function renderActivityGraph() {
  const AG = (DATA.activityGraph || []).map((d) => {
    const [y, m, day] = d.date.split('-').map(Number);
    return { date: new Date(y, m - 1, day), count: d.count };
  });
  const W = 760, H = 176, x0 = 38, x1 = 748, y0 = 14, y1 = 132;
  const n = Math.max(1, AG.length), max = Math.max(1, ...AG.map((d) => d.count));
  const px = (i) => x0 + (i / (n - 1 || 1)) * (x1 - x0);
  const py = (c) => y1 - (c / max) * (y1 - y0);
  const pts = AG.map((d, i) => `${px(i).toFixed(1)},${py(d.count).toFixed(1)}`).join(' ');
  const area = `${x0},${y1} ${pts} ${x1},${y1}`;
  const MO = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const grid = [0, .5, 1].map((f) => { const gy = y1 - f * (y1 - y0); return `<line x1="${x0}" y1="${gy}" x2="${x1}" y2="${gy}" style="stroke:var(--line)"/>`; }).join('');
  const yLab = [0, .5, 1].map((f) => { const gy = y1 - f * (y1 - y0); const v = f === 0 ? 0 : f === 1 ? max : Math.round(max / 2); return `<text x="30" y="${gy + 4}" style="fill:var(--dim)" font-size="11" text-anchor="end">${v}</text>`; }).join('');
  const ticks = []; for (let i = 0; i < AG.length; i += 7) ticks.push(i); if (AG.length && ticks[ticks.length - 1] !== AG.length - 1) ticks.push(AG.length - 1);
  const xLab = ticks.map((i) => {
    const x = px(i).toFixed(1), d = AG[i].date;
    return `<line x1="${x}" y1="${y1}" x2="${x}" y2="${y1 + 5}" style="stroke:var(--dim)"/><text x="${x}" y="${y1 + 20}" style="fill:var(--dim)" font-size="11" text-anchor="middle">${MO[d.getMonth()]} ${d.getDate()}</text>`;
  }).join('');
  const total = AG.reduce((s, d) => s + d.count, 0), avg = AG.length ? (total / AG.length).toFixed(1) : '0.0';
  $('#activityGraph').innerHTML =
    `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="activity last 30 days">
      <defs><linearGradient id="agGrad" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0" style="stop-color:var(--title);stop-opacity:.35"/><stop offset="1" style="stop-color:var(--title);stop-opacity:0"/>
      </linearGradient></defs>
      ${grid}
      <polygon points="${area}" fill="url(#agGrad)"/>
      <polyline points="${pts}" fill="none" style="stroke:var(--title)" stroke-width="2" stroke-linejoin="round"/>
      ${yLab}${xLab}
    </svg>
    <div class="ag-foot"><span>${total} contributions</span><span>avg ${avg}/day · peak ${max}</span></div>`;
})();

// Snake — illustrative moving snake (live page embeds the animated
// snake.svg generated by Platane/snk alongside this HTML).
const SNK_COLS = 34, SNK_ROWS = 7;
const sg = $('#snakeGrid');
sg.innerHTML = Array.from({ length: SNK_COLS * SNK_ROWS }, () => `<span class="scell"></span>`).join('');
const scells = sg.children, SNAKE_LEN = 7, path = [];
for (let r = 0; r < SNK_ROWS; r++) {
  const cols = [...Array(SNK_COLS).keys()];
  if (r % 2) cols.reverse(); // boustrophedon path
  for (const c of cols) path.push(r * SNK_COLS + c);
}
let head = 0;
function snakeTick() {
  for (const s of scells) { s.style.background = ''; s.style.opacity = ''; }
  for (let i = 0; i < SNAKE_LEN; i++) {
    const idx = path[(head - i + path.length) % path.length];
    scells[idx].style.background = 'var(--green)';
    scells[idx].style.opacity = (1 - i / SNAKE_LEN).toFixed(2);
  }
  head = (head + 1) % path.length;
}
setInterval(snakeTick, 110); snakeTick();

document.addEventListener('mousemove', (e) => {
  const t = e.target.closest('[data-tip]');
  if (!t) { tip.style.opacity = 0; return; }
  tip.textContent = t.dataset.tip; tip.style.opacity = 1;
  tip.style.left = Math.min(e.clientX + 12, window.innerWidth - tip.offsetWidth - 8) + 'px';
  tip.style.top = (e.clientY + 14) + 'px';
});

// Repos: 5 by default, filter/sort, show-all toggle
const REPO_DEFAULT = 5;
const REPOS = DATA.repoList || [];
const tbody = $('#repoBody'), search = $('#repoSearch'), sortSel = $('#repoSort'), moreBtn = $('#repoToggle');
const daysSince = (iso) => (iso ? Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)) : 0);
const agoLbl = (d) => (d === 0 ? 'today' : d === 1 ? 'yesterday' : d < 30 ? d + 'd ago' : Math.round(d / 30) + 'mo ago');
let sortKey = 'stars', sortDir = -1, expanded = false;
function sortVal(r, key) {
  return key === 'updated' ? new Date(r.updatedAt).getTime() : r[key];
}
function render() {
  const q = search.value.trim().toLowerCase();
  let rows = REPOS.filter((r) => !q || `${r.name} ${r.description} ${r.language}`.toLowerCase().includes(q));
  rows.sort((a, b) => {
    const va = sortVal(a, sortKey), vb = sortVal(b, sortKey);
    if (typeof va === 'string') return sortDir * va.localeCompare(vb);
    return sortDir * (va - vb);
  });
  const showAll = expanded || q;
  const shown = showAll ? rows : rows.slice(0, REPO_DEFAULT);
  tbody.innerHTML = shown.map((r) =>
    `<tr><td><a class="repo-name" href="${safeUrl(r.url)}" target="_blank" rel="noopener">${escapeHtml(r.name)}</a><div class="repo-desc">${escapeHtml(r.description)}</div></td>
      <td><span class="lang-tag"><span class="dot" style="background:${safeColor(r.langColor)}"></span>${escapeHtml(r.language || '')}</span></td>
      <td class="num">${r.stars}</td><td class="num">${r.forks}</td>
      <td class="num" style="color:var(--dim)">${agoLbl(daysSince(r.updatedAt))}</td></tr>`).join('');
  if (q || rows.length <= REPO_DEFAULT) {
    moreBtn.parentElement.style.display = 'none';
  } else {
    moreBtn.parentElement.style.display = 'block';
    moreBtn.textContent = expanded ? 'Show top 5' : `Show all ${REPOS.length} repositories →`;
  }
}
search.addEventListener('input', render);
sortSel.addEventListener('change', () => { sortKey = sortSel.value; sortDir = sortKey === 'name' ? 1 : -1; render(); });
moreBtn.addEventListener('click', () => { expanded = !expanded; render(); });
document.querySelectorAll('table.repos th[data-sort]').forEach((th) =>
  th.addEventListener('click', () => {
    const k = th.dataset.sort;
    if (k === sortKey) sortDir *= -1; else { sortKey = k; sortDir = (k === 'name' || k === 'language') ? 1 : -1; }
    render();
  }));
render();

// Theme toggle
const root = document.documentElement, themeBtn = $('#themeBtn'), themeLbl = $('#themeLbl');
let dark = !window.matchMedia('(prefers-color-scheme: light)').matches;
function applyTheme() { root.setAttribute('data-theme', dark ? 'dark' : 'light'); themeLbl.textContent = dark ? 'Light' : 'Dark'; }
applyTheme();
themeBtn.addEventListener('click', () => { dark = !dark; applyTheme(); });
