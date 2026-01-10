const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const { execSync } = require('child_process');
const https = require('https');

// Chargement des données
const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'data.json'), 'utf8'));

// --- GITHUB FETCH ---
async function getGitHubActivity(username) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'api.github.com',
      path: `/users/${username}/events/public`,
      headers: { 'User-Agent': 'Node.js-CV-Builder' }
    };
    
    https.get(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const events = JSON.parse(body);
          const lastPush = events.find(e => e.type === 'PushEvent');
          if (lastPush) {
            const repoName = lastPush.repo.name.split('/')[1];
            const date = new Date(lastPush.created_at);
            resolve({ repo: repoName, date: date });
          } else {
            resolve(null);
          }
        } catch (e) { resolve(null); }
      });
    }).on('error', () => resolve(null));
  });
}

// --- COMPILATION CSS ---
// (Désactivé pour stabilité Docker - Retour CDN)
// console.log("Compilation du CSS Tailwind...");
// ...

// Configuration des libellés par langue
const i18n = {
  fr: {
    contact: "Contact",
    languages: "Langues",
    skills: "Soft Skills",
    certifications: "Certifications",
    profile: "Profil",
    experience: "Expériences",
    education: "Formation",
    print: "PDF / IMPRIMER",
    proSkills: "Compétences",
    projects: "Projets Side",
    onboarding: "Personnalisez votre expérience ici"
  },
  en: {
    contact: "Contact",
    languages: "Languages",
    skills: "Personal Skills",
    certifications: "Certifications",
    profile: "Profile",
    experience: "Experience",
    education: "Education",
    print: "PDF / PRINT",
    proSkills: "Professional Skills",
    projects: "Side Projects",
    onboarding: "Personalize your experience here"
  }
};

// --- HELPERS ---
function highlightMetrics(text) {
  if (!text) return "";
  return text.replace(/(\b\d+(?:[.,]\d+)?%?|\b\d+\s*(?:servers?|nodes?|k|M|€|\$|users?|years?|projects?)\b|\d+\+)/gi, (match) => {
    return `<span class="accent-text font-black font-mono tracking-tight">${match}</span>`;
  });
}

function generateRadarChart(skills) {
  const size = 200;
  const center = size / 2;
  const radius = size * 0.4;
  const angleStep = (Math.PI * 2) / skills.length;
  
  const levelsMapping = { "Linux": 95, "HPC": 90, "Storage": 85, "DevOps": 88, "Observability": 92, "Cloud/Virt": 80, "Development": 85, "IoT/3D": 70 };

  const points = skills.map((s, i) => {
    const val = s.level || levelsMapping[s.category] || 50;
    const level = val / 100;
    const x = center + Math.cos(i * angleStep - Math.PI / 2) * radius * level;
    const y = center + Math.sin(i * angleStep - Math.PI / 2) * radius * level;
    return `${x},${y}`;
  }).join(' ');

  const gridLevels = [0.25, 0.5, 0.75, 1];
  const grids = gridLevels.map(l => {
    const p = skills.map((_, i) => {
      const x = center + Math.cos(i * angleStep - Math.PI / 2) * radius * l;
      const y = center + Math.sin(i * angleStep - Math.PI / 2) * radius * l;
      return `${x},${y}`;
    }).join(' ');
    return `<polygon points="${p}" fill="none" stroke="currentColor" stroke-width="0.5" opacity="0.1" />`;
  }).join('');

  const labels = skills.map((s, i) => {
    const x = center + Math.cos(i * angleStep - Math.PI / 2) * (radius + 25);
    const y = center + Math.sin(i * angleStep - Math.PI / 2) * (radius + 10);
    return `<text x="${x}" y="${y}" text-anchor="middle" font-size="8" font-weight="900" fill="currentColor" opacity="0.4" class="uppercase tracking-tighter">${s.category}</text>`;
  }).join('');

  return `<svg viewBox="0 0 ${size} ${size}" class="w-full h-full opacity-80">${grids}<polygon points="${points}" fill="var(--accent)" fill-opacity="0.2" stroke="var(--accent)" stroke-width="2" />${labels}</svg>`;
}

// --- GÉNÉRATEUR HTML ---
function generateHTML(lang, activity = null) {
  const lang2 = lang === 'fr' ? 'en' : 'fr';
  const t1 = i18n[lang];
  const t2 = i18n[lang2];
  const c = data.contact;
  const updateDate = new Date().toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US', { day: '2-digit', month: 'short', year: 'numeric' });
  const pdfFilename = lang === 'fr' ? 'CV_Thomas_Bourcey_FR.pdf' : 'Resume_Thomas_Bourcey_EN.pdf';
  
  const activityHtml = activity ? `<div class="flex items-center justify-end gap-3 text-emerald-500/80 font-bold mb-1"><div class="status-pulse"></div><span class="text-[10px]">LATEST FOCUS: <span class="text-emerald-400 underline decoration-emerald-500/30">${activity.repo}</span></span></div>` : '';
  
  const flip = (c1, c2, delay='') => `
    <div class="flip-container ${delay}">
        <div class="flip-card">
            <div class="flip-front">${c1}</div>
            <div class="flip-back">${c2}</div>
        </div>
    </div>`;

  // Injection du script client
  const clientScript = fs.readFileSync(path.join(__dirname, 'client.js'), 'utf8');

  return `<!DOCTYPE html>
<html lang="${lang}" class="dark" id="html-root" style="font-size: 14px;">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${c.name} - ${c.title[lang]}</title>
    <link rel="alternate" hreflang="${lang}" href="https://tomzone.fr/index_${lang}.html" />
    <link rel="alternate" hreflang="${lang2}" href="https://tomzone.fr/index_${lang2}.html" />
    <meta name="description" content="${data.summary[lang].substring(0, 150).replace(/<[^>]*>/g, '')}...">
    <meta property="og:title" content="${c.name} - ${c.title[lang]}">
    <meta property="og:image" content="https://tomzone.fr/preview_${lang}.png">
    <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>👨‍💻</text></svg>">
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/lucide@latest"></script>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=VT323&family=Archivo+Black&family=Inter:wght@300..900&family=JetBrains+Mono:wght@400..700&family=Geist:wght@100..900&family=Geist+Mono:wght@100..900&family=Space+Grotesk:wght@300..700&family=IBM+Plex+Mono:wght@300..700&family=Michroma&family=Fira+Code:wght@300..700&family=Montserrat:wght@100..900&family=Oxygen:wght@300..700&family=Oxygen+Mono&display=swap');
        
        :root { --accent: #3b82f6; --accent-rgba: 59, 130, 246; --bg-page: #09090b; --bg-card: #18181b; --border-card: rgba(255, 255, 255, 0.05); --text-main: #f4f4f5; --text-muted: #a1a1aa; --track-color: #3f3f46; --font-sans: 'Inter', sans-serif; --font-mono: 'JetBrains Mono', monospace; }

        /* Font Stacks */
        .font-hub { --font-sans: 'Inter', sans-serif; --font-mono: 'JetBrains Mono', monospace; }
        .font-geist { --font-sans: 'Geist', sans-serif; --font-mono: 'Geist Mono', monospace; }
        .font-space { --font-sans: 'Space Grotesk', sans-serif; --font-mono: 'IBM Plex Mono', monospace; }
        .font-archivo { --font-sans: 'Archivo Black', sans-serif; --font-mono: 'JetBrains Mono', monospace; }
        .font-quantum { --font-sans: 'Michroma', sans-serif; --font-mono: 'Inter', sans-serif; }
        .font-console { --font-sans: 'Fira Code', monospace; --font-mono: 'Fira Code', monospace; }
        .font-architect { --font-sans: 'Montserrat', sans-serif; --font-mono: 'Montserrat', sans-serif; }
        .font-oxy { --font-sans: 'Oxygen', sans-serif; --font-mono: 'Oxygen Mono', monospace; }

        .theme-light { --bg-page: #f4f4f5; --bg-card: #ffffff; --border-card: #e4e4e7; --text-main: #18181b; --text-muted: #52525b; --track-color: #d4d4d8; }
        .theme-deep { --bg-page: #09090b; --bg-card: #18181b; --border-card: rgba(255, 255, 255, 0.05); --text-main: #f4f4f5; --text-muted: #a1a1aa; --track-color: #3f3f46; }
        .theme-dark { --bg-page: #000000; --bg-card: #09090b; --border-card: rgba(255, 255, 255, 0.05); --text-main: #f4f4f5; --text-muted: #a1a1aa; --track-color: #27272a; }
        body { font-family: var(--font-sans); background-color: var(--bg-page); color: var(--text-main); transition: background-color 0.3s ease, color 0.3s ease; line-height: 1.6; }
        .card { background: var(--bg-card); border: 1px solid var(--border-card); border-radius: 1.5rem; transition: transform 0.3s ease, border-color 0.3s ease; position: relative; overflow: hidden; }
        .card::before { content: ""; position: absolute; inset: 0; background: radial-gradient(800px circle at var(--mouse-x) var(--mouse-y), rgba(var(--accent-rgba), 0.08), transparent 40%); z-index: 0; opacity: 0; transition: opacity 0.5s ease; pointer-events: none; }
        .card:hover::before { opacity: 1; }
        .card > * { position: relative; z-index: 1; }
        .card:hover { transform: translateY(-4px); box-shadow: 0 0 40px 5px rgba(var(--accent-rgba), 0.15); border-color: rgba(var(--accent-rgba), 0.4) !important; }
        .flip-container { perspective: 2000px; }
        .flip-card { display: grid; grid-template-columns: 1fr; transition: transform 0.8s cubic-bezier(0.4, 0, 0.2, 1); transform-style: preserve-3d; }
        .flip-front, .flip-back { grid-area: 1 / 1; backface-visibility: hidden; width: 100%; }
        .flip-front { transform: rotateY(0deg); z-index: 2; }
        .flip-back { transform: rotateY(180deg); z-index: 1; }
        .flip-container.flipped .flip-card { transform: rotateY(-180deg); }
        .delay-50 .flip-card { transition-delay: 0.05s; }
        .delay-100 .flip-card { transition-delay: 0.1s; }
        .delay-200 .flip-card { transition-delay: 0.2s; }
        .delay-300 .flip-card { transition-delay: 0.3s; }
        .delay-350 .flip-card { transition-delay: 0.35s; }
        .delay-400 .flip-card { transition-delay: 0.4s; }
        .accent-text { color: var(--accent); }
        .accent-bg { background-color: var(--accent); }
        .accent-border { border-color: var(--accent); }
        #settings-panel { position: fixed; top: 95px; right: 24px; width: 360px; padding: 32px; background: rgba(24, 24, 27, 0.95); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 2.5rem; z-index: 100; opacity: 0; pointer-events: none; transform: translateY(10px); transition: all 0.4s ease; backdrop-filter: blur(24px); }
        #settings-panel.open { opacity: 1; pointer-events: auto; transform: translateY(0); }
        @media (max-width: 768px) { #settings-panel { top: auto; bottom: 0; right: 0; left: 0; width: 100%; max-height: 85vh; border-radius: 2rem 2rem 0 0; transform: translateY(100%); padding: 24px; } #settings-panel.open { transform: translateY(0); } .panel-handle { width: 40px; height: 4px; background: rgba(255,255,255,0.1); border-radius: 2px; margin: -12px auto 24px; display: block; } .theme-light .panel-handle { background: rgba(0,0,0,0.1); } }
        .panel-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 32px; }
        .font-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 32px; }
        .panel-btn { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; padding: 12px; border-radius: 1.25rem; font-size: 8px; font-weight: 800; text-transform: uppercase; border: 2px solid transparent; transition: all 0.2s; background: rgba(255,255,255,0.05); color: #71717a; cursor: pointer; }
        #btn-light { background: #f4f4f5; } #btn-deep { background: #27272a; } #btn-dark { background: #000000; }
        .panel-btn:hover { border-color: var(--accent); transform: scale(1.05); } .panel-btn.active { border-color: var(--accent); color: var(--accent); ring: 4px solid rgba(var(--accent-rgba), 0.2); }
        .accent-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 14px; margin-bottom: 32px; }
        .accent-dot { width: 36px; height: 36px; border-radius: 999px; cursor: pointer; transition: all 0.2s; border: 2px solid transparent; }
        .accent-dot:hover { transform: scale(1.1); } .accent-dot.active { border-color: white; box-shadow: 0 0 15px var(--accent); }
        @keyframes aura { 0% { box-shadow: 0 0 0 0px rgba(var(--accent-rgba), 0.4); } 100% { box-shadow: 0 0 0 30px rgba(var(--accent-rgba), 0); } }
        .aura-pulse { animation: aura 2s infinite !important; border-color: var(--accent) !important; }
        #onboarding-tip { position: fixed; top: 95px; right: 24px; z-index: 150; background: var(--accent); color: white; padding: 14px 24px; border-radius: 1.5rem; font-weight: 800; font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; box-shadow: 0 10px 30px rgba(var(--accent-rgba), 0.4); pointer-events: none; opacity: 0; transform: translateY(10px); transition: all 0.6s cubic-bezier(0.22, 1, 0.36, 1); }
        #onboarding-tip.show { opacity: 1; transform: translateY(0); }
        #onboarding-tip::after { content: ""; position: absolute; top: -8px; right: 22px; border-left: 8px solid transparent; border-right: 8px solid transparent; border-bottom: 8px solid var(--accent); }
        input[type=range] { -webkit-appearance: none; width: 100%; background: transparent; height: 32px; }
        input[type=range]::-webkit-slider-runnable-track { width: 100%; height: 6px; background: var(--track-color); border-radius: 3px; }
        input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; height: 18px; width: 18px; border-radius: 50%; background: var(--accent); cursor: pointer; margin-top: -7px; border: 3px solid var(--bg-card); box-shadow: 0 0 15px var(--accent); }
        
        /* Firefox Support */
        input[type=range]::-moz-range-track { width: 100%; height: 6px; background: var(--track-color); border-radius: 3px; }
        input[type=range]::-moz-range-thumb { height: 18px; width: 18px; border-radius: 50%; background: var(--accent); cursor: pointer; border: 3px solid var(--bg-card); box-shadow: 0 0 15px var(--accent); }
        .cog-btn { position: fixed; top: 24px; right: 24px; width: 60px; height: 60px; display: flex; align-items: center; justify-content: center; background: rgba(24, 24, 27, 0.8); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 1.5rem; color: #a1a1aa; cursor: pointer; z-index: 101; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
        .cog-btn:hover { border-color: var(--accent); color: white; transform: rotate(30deg) scale(1.05); }
        .mode-tty { --bg-page: #000000 !important; --bg-card: #000000 !important; --text-main: #33ff00 !important; --text-muted: #008f11 !important; --accent: #33ff00 !important; --border-card: #008f11 !important; --font-sans: 'VT323', monospace !important; --font-mono: 'VT323', monospace !important; cursor: text; }
        .mode-tty * { border-radius: 0 !important; box-shadow: none !important; text-transform: uppercase !important; letter-spacing: 0.1em !important; }
        .mode-tty .card { border: 1px solid var(--border-card) !important; background: transparent !important; }
        .mode-tty i[data-lucide] { display: none !important; }
        .mode-tty .tool-tag { border: 1px solid var(--border-card) !important; background: transparent !important; color: var(--text-main) !important; }
        .mode-tty .rounded-full, .mode-tty .rounded-2xl, .mode-tty .rounded-xl { border-radius: 0 !important; }
        .mode-tty::before { content: " "; display: block; position: fixed; top: 0; left: 0; bottom: 0; right: 0; background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06)); z-index: 999; background-size: 100% 2px, 3px 100%; pointer-events: none; }
        .mode-tty .tty-toggle { color: #33ff00; border-color: #33ff00; box-shadow: 0 0 10px #33ff00; }
        .switch { position: relative; display: inline-block; width: 44px; height: 24px; }
        .switch input { opacity: 0; width: 0; height: 0; }
        .slider { position: absolute; cursor: pointer; inset: 0; background-color: var(--track-color); transition: .4s; border-radius: 24px; border: 1px solid var(--border-card); }
        .slider:before { position: absolute; content: ""; height: 18px; width: 18px; left: 2px; bottom: 2px; background-color: white; transition: .4s; border-radius: 50%; box-shadow: 0 2px 4px rgba(0,0,0,0.2); }
        input:checked + .slider { background-color: var(--accent); border-color: transparent; }
        input:checked + .slider:before { transform: translateX(20px); }
        input:focus + .slider { box-shadow: 0 0 1px var(--accent); }
        .status-pulse { width: 8px; height: 8px; background: #10b981; border-radius: 50%; position: relative; }
        .status-pulse::after { content: ''; position: absolute; inset: -4px; border-radius: 50%; border: 2px solid #10b981; animation: sonar 2s infinite; }
        @keyframes sonar { 0% { transform: scale(1); opacity: 0.8; } 100% { transform: scale(2.5); opacity: 0; } }
        .timeline-progress-bar { position: absolute; left: -1px; top: 0; width: 2px; background: var(--accent); box-shadow: 0 0 20px var(--accent); transition: height 0.1s linear; z-index: 10; }
        .timeline-progress-bar::after { content: ''; position: absolute; bottom: 0; left: 50%; transform: translate(-50%, 50%); width: 8px; height: 8px; background: var(--accent); border-radius: 50%; box-shadow: 0 0 15px var(--accent); }
        #cmd-palette { position: fixed; inset: 0; z-index: 200; display: none; align-items: flex-start; justify-content: center; padding-top: 15vh; background: rgba(0,0,0,0.4); backdrop-filter: blur(4px); }
        #cmd-palette.open { display: flex; }
        .cmd-box { width: 100%; max-width: 600px; background: var(--bg-card); border: 1px solid var(--border-card); border-radius: 1.25rem; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); overflow: hidden; animation: slideUp 0.2s ease-out; }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .cmd-input { width: 100%; padding: 1.5rem; background: transparent; border: none; color: var(--text-main); font-size: 1.1rem; outline: none; border-bottom: 1px solid var(--border-card); }
        .cmd-results { max-height: 400px; overflow-y: auto; padding: 0.5rem; }
        .cmd-item { padding: 1rem; border-radius: 0.75rem; display: flex; align-items: center; gap: 1rem; cursor: pointer; transition: all 0.2s; color: var(--text-muted); }
        .cmd-item:hover, .cmd-item.active { background: rgba(var(--accent-rgba), 0.1); color: var(--accent); }
        .exp-card { transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1); }
        .exp-card.dimmed { opacity: 0.15; filter: grayscale(0.8) blur(1px); transform: scale(0.98); }
        .exp-card.highlight { opacity: 1 !important; filter: none !important; transform: scale(1.02); border-left-color: var(--accent) !important; }
        .exp-card.highlight .accent-text { text-shadow: 0 0 15px var(--accent); }
        @media print { body { background-color: white !important; color: black !important; padding: 0 !important; font-family: 'Inter', sans-serif !important; } .no-print { display: none !important; } .card { background: white !important; border: 1px solid #e4e4e7 !important; box-shadow: none !important; border-radius: 0.5rem !important; } strong, .accent-text { color: black !important; font-weight: 800 !important; } .accent-bg { background-color: #000 !important; } }
    </style>
</head>
<body class="p-4 md:p-8 lg:p-12 theme-deep font-hub" id="body-root">
    
    <div id="onboarding-tip" class="no-print text-left">
        ${flip(`<div class="flex items-center gap-3"><i data-lucide="sparkles" class="w-4 h-4"></i><span>${t1.onboarding}</span><i data-lucide="arrow-up" class="w-3 h-3 opacity-50 ml-1"></i></div>`, `<div class="flex items-center gap-3"><i data-lucide="sparkles" class="w-4 h-4"></i><span>${t2.onboarding}</span><i data-lucide="arrow-up" class="w-3 h-3 opacity-50 ml-1"></i></div>`)}
    </div>

    <button onclick="toggleSettings()" class="cog-btn no-print" id="main-cog"><i data-lucide="settings" style="width: 28px; height: 28px;"></i></button>

    <div id="settings-panel" class="no-print">
        <div class="panel-handle md:hidden"></div>
        
        <!-- LANGUAGE -->
        <label class="text-[10px] font-black uppercase tracking-widest opacity-50 mb-3 block text-center">Language</label>
        <div class="flex p-1 bg-white/5 rounded-xl border border-white/5 mb-8 relative">
            <button id="btn-lang-fr" onclick="if(!this.classList.contains('bg-white')) toggleLanguage()" class="flex-1 py-2 rounded-lg text-[10px] font-bold uppercase transition-all ${lang === 'fr' ? 'bg-white text-black shadow-lg' : 'opacity-50 hover:opacity-100'} flex items-center justify-center gap-2">
                <span class="text-base">🇫🇷</span> FR
            </button>
            <button id="btn-lang-en" onclick="if(!this.classList.contains('bg-white')) toggleLanguage()" class="flex-1 py-2 rounded-lg text-[10px] font-bold uppercase transition-all ${lang === 'en' ? 'bg-white text-black shadow-lg' : 'opacity-50 hover:opacity-100'} flex items-center justify-center gap-2">
                <span class="text-base">🇬🇧</span> EN
            </button>
        </div>

        <!-- APPEARANCE -->
        <label class="text-[10px] font-black uppercase tracking-widest opacity-50 mb-3 block text-center">Appearance</label>
        <div class="flex p-1 bg-white/5 rounded-xl border border-white/5 mb-8">
            <button onclick="setTheme('light')" class="panel-btn flex-1 py-2 rounded-lg text-[10px] font-bold uppercase transition-all opacity-50 hover:opacity-100" id="btn-light">Light</button>
            <button onclick="setTheme('deep')" class="panel-btn flex-1 py-2 rounded-lg text-[10px] font-bold uppercase transition-all opacity-50 hover:opacity-100" id="btn-deep">Deep</button>
            <button onclick="setTheme('dark')" class="panel-btn flex-1 py-2 rounded-lg text-[10px] font-bold uppercase transition-all opacity-50 hover:opacity-100" id="btn-dark">Dark</button>
        </div>

        <!-- ACCENT COLOR -->
        <label class="text-[10px] font-black uppercase tracking-widest opacity-50 mb-3 block text-center">Accent Color</label>
        <div class="accent-grid mb-8" id="accent-picker"></div>

        <!-- DATA SCALING -->
        <label class="text-[10px] font-black uppercase tracking-widest opacity-50 mb-3 block text-center">Data Scaling</label>
        <div class="flex items-center gap-4 px-2 mb-8 text-white">
            <span style="font-size: 12px !important; color: inherit;" class="font-serif italic opacity-40">a</span>
            <input type="range" min="12" max="20" value="14" step="1" oninput="setFontSize(this.value)" class="flex-grow">
            <span style="font-size: 20px !important; color: inherit;" class="font-serif italic opacity-40">A</span>
        </div>

        <!-- SYSTEM MODE -->
        <label class="text-[10px] font-black uppercase tracking-widest opacity-50 mb-3 block text-center">System Mode</label>
        <div class="flex p-1 bg-white/5 rounded-xl border border-white/5 mb-8">
            <button onclick="updateTTY(false)" id="btn-std" class="flex-1 py-2 rounded-lg text-[10px] font-bold uppercase transition-all bg-white text-black shadow-lg flex items-center justify-center gap-2">
                <i data-lucide="monitor" class="w-3 h-3"></i> Standard
            </button>
            <button onclick="updateTTY(true)" id="btn-matrix" class="flex-1 py-2 rounded-lg text-[10px] font-bold uppercase transition-all opacity-50 hover:opacity-100 flex items-center justify-center gap-2">
                <i data-lucide="terminal" class="w-3 h-3"></i> Matrix
            </button>
        </div>

        <!-- FONT STACK -->
        <label class="text-[10px] font-black uppercase tracking-widest opacity-50 mb-3 block text-center">Font Stack</label>
        <div class="font-grid">
            <button onclick="setFontStack('hub')" class="panel-btn font-btn" id="f-hub">HUB</button>
            <button onclick="setFontStack('geist')" class="panel-btn font-btn" id="f-geist">GEIST</button>
            <button onclick="setFontStack('space')" class="panel-btn font-btn" id="f-space">SPACE</button>
            <button onclick="setFontStack('archivo')" class="panel-btn font-btn" id="f-archivo">ARCHIV</button>
            <button onclick="setFontStack('quantum')" class="panel-btn font-btn" id="f-quantum">QUANT</button>
            <button onclick="setFontStack('console')" class="panel-btn font-btn" id="f-console">CONSOL</button>
            <button onclick="setFontStack('architect')" class="panel-btn font-btn" id="f-architect">ARCHI</button>
            <button onclick="setFontStack('oxy')" class="panel-btn font-btn" id="f-oxy">OXY</button>
        </div>
    </div>

    <div class="max-w-7xl mx-auto flex flex-col gap-12 text-left">
        ${flip(`
        <header class="card p-10 md:p-16 flex flex-col md:flex-row items-center gap-12 relative overflow-hidden group reveal" style="animation-delay: 0s">
            <div class="absolute -top-6 -right-6 p-12 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity text-left pointer-events-none"><i data-lucide="box" style="width: 180px; height: 180px;"></i></div>
            <div class="w-40 h-40 bg-slate-800/20 rounded-[2.5rem] flex items-center justify-center border-2 accent-border relative shrink-0 z-10">
                <i data-lucide="user" class="w-20 h-20 accent-text"></i>
                <div class="absolute -bottom-2 -right-2 w-8 h-8 accent-bg border-[6px] border-[#18181b] rounded-full animate-pulse shadow-[0_0_20px_var(--accent)]"></div>
            </div>
            <div class="text-center md:text-left flex-grow text-left relative z-10">
                <h1 class="text-5xl md:text-6xl font-black tracking-tighter uppercase italic mb-4 leading-none" style="font-family: var(--font-sans);">${c.name}</h1>
                <p class="accent-text font-mono text-lg font-bold uppercase tracking-[0.3em] mb-8 text-left">${c.title[lang]}</p>
                <div class="flex flex-wrap justify-center md:justify-start gap-4 no-print text-left">
                    <a href="${pdfFilename}" download class="accent-bg text-slate-950 px-8 py-3 rounded-2xl font-black text-xs tracking-widest transition-all hover:scale-105 shadow-xl shadow-cyan-500/10 flex items-center gap-3"><i data-lucide="download" class="w-4 h-4"></i> DOWNLOAD PDF</a>
                    <a href="https://github.com/${c.github}" target="_blank" class="p-3 card hover:accent-border"><i data-lucide="github" class="w-5 h-5"></i></a>
                    <a href="https://linkedin.com/in/${c.linkedin}" target="_blank" class="p-3 card hover:accent-border"><i data-lucide="linkedin" class="w-5 h-5"></i></a>
                </div>
            </div>
            <div class="hidden lg:flex flex-col gap-4 text-right opacity-40 font-mono text-[10px] uppercase tracking-[0.2em]">
                ${activityHtml}
                <span>Status: system_ready</span>
                <span>Uptime: 15y_experience</span>
                <div class="flex items-center gap-2 justify-end opacity-60">
                    <span class="px-1.5 py-0.5 border border-white/20 rounded">CTRL</span>
                    <span>+</span>
                    <span class="px-1.5 py-0.5 border border-white/20 rounded">K</span>
                </div>
                <span>Sync: ${updateDate}</span>
            </div>
        </header>`, 
        `
        <header class="card p-10 md:p-16 flex flex-col md:flex-row items-center gap-12 relative overflow-hidden group">
            <div class="absolute -top-6 -right-6 p-12 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity text-left pointer-events-none"><i data-lucide="box" style="width: 180px; height: 180px;"></i></div>
            <div class="w-40 h-40 bg-slate-800/20 rounded-[2.5rem] flex items-center justify-center border-2 accent-border relative shrink-0 z-10">
                <i data-lucide="user" class="w-20 h-20 accent-text"></i>
                <div class="absolute -bottom-2 -right-2 w-8 h-8 accent-bg border-[6px] border-[#18181b] rounded-full animate-pulse shadow-[0_0_20px_var(--accent)]"></div>
            </div>
            <div class="text-center md:text-left flex-grow text-left relative z-10">
                <h1 class="text-5xl md:text-6xl font-black tracking-tighter uppercase italic mb-4 leading-none" style="font-family: var(--font-sans);">${c.name}</h1>
                <p class="accent-text font-mono text-lg font-bold uppercase tracking-[0.3em] mb-8 text-left">${c.title[lang2]}</p>
                <div class="flex flex-wrap justify-center md:justify-start gap-4 no-print text-left">
                    <a href="${lang === 'fr' ? 'Resume_Thomas_Bourcey_EN.pdf' : 'CV_Thomas_Bourcey_FR.pdf'}" download class="accent-bg text-slate-950 px-8 py-3 rounded-2xl font-black text-xs tracking-widest transition-all hover:scale-105 shadow-xl shadow-cyan-500/10 flex items-center gap-3"><i data-lucide="download" class="w-4 h-4"></i> DOWNLOAD PDF</a>
                </div>
            </div>
            <div class="hidden lg:flex flex-col gap-4 text-right opacity-40 font-mono text-[10px] uppercase tracking-[0.2em]">
                ${activityHtml}
                <span>Status: system_ready</span>
                <span>Uptime: 15y_experience</span>
                <div class="flex items-center gap-2 justify-end opacity-60">
                    <span class="px-1.5 py-0.5 border border-white/20 rounded">CTRL</span>
                    <span>+</span>
                    <span class="px-1.5 py-0.5 border border-white/20 rounded">K</span>
                </div>
                <span>Sync: ${updateDate}</span>
            </div>
        </header>`
        )}

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start text-left">
            <div class="lg:col-span-4 flex flex-col gap-12 text-left">
                ${flip(`
                <section class="flex flex-col gap-4 reveal text-left" style="animation-delay: 0.05s">
                    <div class="flex items-center gap-4 px-4 text-left"><i data-lucide="bar-chart-3" class="w-5 h-5 accent-text"></i><h2 class="text-[10px] font-black uppercase tracking-[0.3em] opacity-50" style="font-family: var(--font-sans);">Expertise Overview</h2></div>
                    <div class="card p-4 flex items-center justify-center h-64">
                        ${generateRadarChart(data.skills.professional)}
                    </div>
                </section>`,
                `<section class="flex flex-col gap-4 text-left">
                    <div class="flex items-center gap-4 px-4 text-left"><i data-lucide="bar-chart-3" class="w-5 h-5 accent-text"></i><h2 class="text-[10px] font-black uppercase tracking-[0.3em] opacity-50" style="font-family: var(--font-sans);">Expertise Overview</h2></div>
                    <div class="card p-4 flex items-center justify-center h-64">
                        ${generateRadarChart(data.skills.professional)}
                    </div>
                </section>`, 'delay-50')}

                ${flip(`
                <section class="flex flex-col gap-4 reveal text-left" style="animation-delay: 0.1s">
                    <div class="flex items-center gap-4 px-4 text-left"><i data-lucide="mail" class="w-5 h-5 accent-text"></i><h2 class="text-[10px] font-black uppercase tracking-[0.3em] opacity-50" style="font-family: var(--font-sans);">${t1.contact}</h2></div>
                    <div class="card p-8 text-left"><ul class="space-y-6 text-[0.95rem] font-mono opacity-80 text-left"><li class="flex items-center gap-4 truncate text-left"><a href="mailto:${c.email}" class="hover:accent-text transition-colors text-left">${c.email}</a></li><li class="flex items-center gap-4 text-slate-500 text-left"><span>${c.website}</span></li><li class="flex items-center gap-4 text-slate-500 text-left"><span>${c.location}</span></li></ul></div>
                </section>`,
                `<section class="flex flex-col gap-4 text-left">
                    <div class="flex items-center gap-4 px-4 text-left"><i data-lucide="mail" class="w-5 h-5 accent-text"></i><h2 class="text-[10px] font-black uppercase tracking-[0.3em] opacity-50" style="font-family: var(--font-sans);">${t2.contact}</h2></div>
                    <div class="card p-8 text-left"><ul class="space-y-6 text-[0.95rem] font-mono opacity-80 text-left"><li class="flex items-center gap-4 truncate text-left"><a href="mailto:${c.email}" class="hover:accent-text transition-colors text-left">${c.email}</a></li><li class="flex items-center gap-4 text-slate-500 text-left"><span>${c.website}</span></li><li class="flex items-center gap-4 text-slate-500 text-left"><span>${c.location}</span></li></ul></div>
                </section>`, 'delay-100')}

                ${flip(`
                <section class="flex flex-col gap-4 reveal text-left" style="animation-delay: 0.2s">
                    <div class="flex items-center gap-4 px-4 text-left"><i data-lucide="globe" class="w-5 h-5 accent-text"></i><h2 class="text-[10px] font-black uppercase tracking-[0.3em] opacity-50" style="font-family: var(--font-sans);">${t1.languages}</h2></div>
                    <div class="card p-8 text-left space-y-8 text-left">${data.languages[lang].map(l => `<div class="text-left"><div class="flex justify-between mb-3 font-bold text-sm text-left"><span>${l.name}</span><span class="accent-text opacity-50 italic font-mono text-[0.7rem]">${l.level}</span></div><div class="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden"><div class="accent-bg h-full opacity-80 shadow-[0_0_8px_var(--accent)]" style="width: ${l.name.includes('rançais') || l.name.includes('rench') ? '100%' : '75%'}"></div></div></div>`).join('')}</div>
                </section>`,
                `<section class="flex flex-col gap-4 text-left">
                    <div class="flex items-center gap-4 px-4 text-left"><i data-lucide="globe" class="w-5 h-5 accent-text"></i><h2 class="text-[10px] font-black uppercase tracking-[0.3em] opacity-50" style="font-family: var(--font-sans);">${t2.languages}</h2></div>
                    <div class="card p-8 text-left space-y-8 text-left">${data.languages[lang2].map(l => `<div class="text-left"><div class="flex justify-between mb-3 font-bold text-sm text-left"><span>${l.name}</span><span class="accent-text opacity-50 italic font-mono text-[0.7rem]">${l.level}</span></div><div class="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden"><div class="accent-bg h-full opacity-80 shadow-[0_0_8px_var(--accent)]" style="width: ${l.name.includes('rançais') || l.name.includes('rench') ? '100%' : '75%'}"></div></div></div>`).join('')}</div>
                </section>`, 'delay-200')}

                ${flip(`
                <section class="flex flex-col gap-4 reveal text-left" style="animation-delay: 0.3s">
                    <div class="flex items-center gap-4 px-4"><i data-lucide="award" class="w-5 h-5 accent-text"></i><h2 class="text-[10px] font-black uppercase tracking-[0.3em] opacity-50" style="font-family: var(--font-sans);">${t1.skills}</h2></div>
                    <div class="card p-8 flex flex-wrap gap-2.5 text-left">${data.skills.personal[lang].map(s => `<span class="px-4 py-2 bg-slate-800/50 text-[0.7rem] font-bold border border-white/5 rounded-xl uppercase hover:accent-border transition-all cursor-default text-left">${s}</span>`).join('')}</div>
                </section>`,
                `<section class="flex flex-col gap-4 text-left">
                    <div class="flex items-center gap-4 px-4"><i data-lucide="award" class="w-5 h-5 accent-text"></i><h2 class="text-[10px] font-black uppercase tracking-[0.3em] opacity-50" style="font-family: var(--font-sans);">${t2.skills}</h2></div>
                    <div class="card p-8 flex flex-wrap gap-2.5 text-left">${data.skills.personal[lang2].map(s => `<span class="px-4 py-2 bg-slate-800/50 text-[0.7rem] font-bold border border-white/5 rounded-xl uppercase hover:accent-border transition-all cursor-default text-left">${s}</span>`).join('')}</div>
                </section>`, 'delay-300')}

                ${flip(`
                <section class="flex flex-col gap-4 reveal text-left" style="animation-delay: 0.4s">
                    <div class="flex items-center gap-4 px-4 text-left"><i data-lucide="graduation-cap" class="w-5 h-5 accent-text"></i><h2 class="text-[10px] font-black uppercase tracking-[0.3em] opacity-50" style="font-family: var(--font-sans);">${t1.education}</h2></div>
                    <div class="card p-8 text-left space-y-8 text-left">${data.education.map(ed => `<div class="flex justify-between items-start gap-4 text-left"><div class="text-left"><p class="text-[0.9rem] font-black text-white uppercase tracking-tight leading-tight mb-1 text-left">${ed.degree[lang]}</p><p class="text-[0.8rem] opacity-40 italic font-mono text-left">${ed.school}</p></div><span class="text-[0.8rem] font-bold text-slate-500 shrink-0 text-left">${ed.year}</span></div>`).join('')}</div>
                </section>`,
                `<section class="flex flex-col gap-4 text-left">
                    <div class="flex items-center gap-4 px-4 text-left"><i data-lucide="graduation-cap" class="w-5 h-5 accent-text"></i><h2 class="text-[10px] font-black uppercase tracking-[0.3em] opacity-50" style="font-family: var(--font-sans);">${t2.education}</h2></div>
                    <div class="card p-8 text-left space-y-8 text-left">${data.education.map(ed => `<div class="flex justify-between items-start gap-4 text-left"><div class="text-left"><p class="text-[0.9rem] font-black text-white uppercase tracking-tight leading-tight mb-1 text-left">${ed.degree[lang2]}</p><p class="text-[0.8rem] opacity-40 italic font-mono text-left">${ed.school}</p></div><span class="text-[0.8rem] font-bold text-slate-500 shrink-0 text-left">${ed.year}</span></div>`).join('')}</div>
                </section>`, 'delay-400')}
                
                ${flip(`
                <section class="flex flex-col gap-4 reveal text-left" style="animation-delay: 0.5s">
                    <div class="flex items-center gap-4 px-4 text-left"><i data-lucide="check-circle-2" class="w-5 h-5 accent-text"></i><h2 class="text-[10px] font-black uppercase tracking-[0.3em] opacity-50" style="font-family: var(--font-sans);">${t1.certifications}</h2></div>
                    <div class="card p-8 text-left flex flex-wrap gap-3 text-left">${data.certifications.map(cert => `<div class="text-[0.75rem] font-mono font-bold opacity-50 px-4 py-2 bg-slate-800/30 border border-white/5 rounded-xl hover:opacity-100 transition-all flex items-center gap-3 text-left"><i data-lucide="check" class="w-3 h-3 accent-text text-left"></i> ${cert}</div>`).join('')}</div>
                </section>`,
                `<section class="flex flex-col gap-4 text-left">
                    <div class="flex items-center gap-4 px-4 text-left"><i data-lucide="check-circle-2" class="w-5 h-5 accent-text"></i><h2 class="text-[10px] font-black uppercase tracking-[0.3em] opacity-50" style="font-family: var(--font-sans);">${t2.certifications}</h2></div>
                    <div class="card p-8 text-left flex flex-wrap gap-3 text-left">${data.certifications.map(cert => `<div class="text-[0.75rem] font-mono font-bold opacity-50 px-4 py-2 bg-slate-800/30 border border-white/5 rounded-xl hover:opacity-100 transition-all flex items-center gap-3 text-left"><i data-lucide="check" class="w-3 h-3 accent-text text-left"></i> ${cert}</div>`).join('')}</div>
                </section>`, 'delay-500')}
            </div>
            <div class="lg:col-span-8 flex flex-col gap-12 text-left">
                ${flip(`
                <section class="flex flex-col gap-4 text-left reveal" style="animation-delay: 0.1s">
                    <div class="flex items-center gap-4 px-4 text-left"><i data-lucide="terminal" class="w-5 h-5 accent-text"></i><h2 class="text-[10px] font-black uppercase tracking-[0.3em] opacity-50" style="font-family: var(--font-sans);">${t1.profile}</h2></div>
                    <div class="card p-12 text-left"><p class="text-[1.15rem] leading-relaxed opacity-80 font-medium text-left" style="text-wrap: balance;">${highlightMetrics(data.summary[lang])}</p></div>
                </section>`,
                `<section class="flex flex-col gap-4 text-left">
                    <div class="flex items-center gap-4 px-4 text-left"><i data-lucide="terminal" class="w-5 h-5 accent-text"></i><h2 class="text-[10px] font-black uppercase tracking-[0.3em] opacity-50" style="font-family: var(--font-sans);">${t2.profile}</h2></div>
                    <div class="card p-12 text-left"><p class="text-[1.15rem] leading-relaxed opacity-80 font-medium text-left" style="text-wrap: balance;">${highlightMetrics(data.summary[lang2])}</p></div>
                </section>`, 'delay-200')}

                ${flip(`
                <section class="flex flex-col gap-6 text-left reveal" style="animation-delay: 0.2s">
                    <div class="flex items-center gap-4 px-4 text-left"><i data-lucide="cpu" class="w-5 h-5 accent-text"></i><h2 class="text-[10px] font-black uppercase tracking-[0.3em] opacity-50" style="font-family: var(--font-sans);">${t1.proSkills}</h2></div>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">${data.skills.professional.map((s, i) => `<div class="card p-8 flex flex-col gap-6 group hover:scale-[1.02] text-left reveal" style="animation-delay: ${0.2 + (i * 0.05)}s"><div class="flex justify-between items-center text-left"><div class="flex items-center gap-4 text-left"><div class="p-2 bg-slate-800 rounded-xl border border-white/10 group-hover:accent-border transition-colors"><i data-lucide="${s.icon || 'cpu'}" class="w-5 h-5 accent-text"></i></div><span class="text-[1rem] font-black uppercase tracking-widest text-white group-hover:accent-text transition-colors">${s.category}</span></div></div><div class="flex flex-wrap gap-2.5 text-left">${s.tools.split(', ').map(tool => `<span class="skill-tag tool-tag px-3.5 py-1.5 bg-black/40 border border-white/5 rounded-xl text-[0.85rem] font-mono text-slate-400 hover:text-white hover:border-accent/30 transition-all flex items-center gap-2 cursor-default text-left" data-skill="${tool.toLowerCase().trim()}"><span class="tool-dot w-1.5 h-1.5 accent-bg opacity-30 rounded-full transition-all"></span>${tool}</span>`).join('')}</div></div>`).join('')}</div>
                </section>`,
                `<section class="flex flex-col gap-6 text-left">
                    <div class="flex items-center gap-4 px-4 text-left"><i data-lucide="cpu" class="w-5 h-5 accent-text"></i><h2 class="text-[10px] font-black uppercase tracking-[0.3em] opacity-50" style="font-family: var(--font-sans);">${t2.proSkills}</h2></div>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">${data.skills.professional.map((s, i) => `<div class="card p-8 flex flex-col gap-6 group hover:scale-[1.02] text-left"><div class="flex justify-between items-center text-left"><div class="flex items-center gap-4 text-left"><div class="p-2 bg-slate-800 rounded-xl border border-white/10 group-hover:accent-border transition-colors"><i data-lucide="${s.icon || 'cpu'}" class="w-5 h-5 accent-text"></i></div><span class="text-[1rem] font-black uppercase tracking-widest text-white group-hover:accent-text transition-colors">${s.category}</span></div></div><div class="flex flex-wrap gap-2.5 text-left">${s.tools.split(', ').map(tool => `<span class="skill-tag tool-tag px-3.5 py-1.5 bg-black/40 border border-white/5 rounded-xl text-[0.85rem] font-mono text-slate-400 hover:text-white hover:border-accent/30 transition-all flex items-center gap-2 cursor-default text-left" data-skill="${tool.toLowerCase().trim()}"><span class="tool-dot w-1.5 h-1.5 accent-bg opacity-30 rounded-full transition-all"></span>${tool}</span>`).join('')}</div></div>`).join('')}</div>
                </section>`, 'delay-300')}

                ${flip(`
                <section class="flex flex-col gap-6 text-left reveal" style="animation-delay: 0.3s">
                    <div class="flex items-center gap-4 px-4 text-left"><i data-lucide="folder-git-2" class="w-5 h-5 accent-text"></i><h2 class="text-[10px] font-black uppercase tracking-[0.3em] opacity-50" style="font-family: var(--font-sans);">${t1.projects}</h2></div>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                        ${data.projects.map(p => `
                        <a href="https://github.com/${p.github}" target="_blank" class="card p-6 flex flex-col gap-4 group hover:border-accent/50 transition-all">
                            <div class="flex justify-between items-start">
                                <div class="p-2 bg-slate-800 rounded-lg"><i data-lucide="${p.icon}" class="w-5 h-5 accent-text"></i></div>
                                <i data-lucide="external-link" class="w-4 h-4 opacity-20 group-hover:opacity-100 transition-opacity"></i>
                            </div>
                            <div>
                                <h3 class="font-black text-sm uppercase tracking-tight mb-2">${p.name}</h3>
                                <p class="text-[0.75rem] opacity-60 leading-relaxed h-12 overflow-hidden">${p.description[lang]}</p>
                            </div>
                            <div class="flex flex-wrap gap-2 mt-auto">
                                ${p.tools.map(tool => `<span class="text-[0.6rem] font-mono opacity-40 px-2 py-0.5 bg-white/5 rounded border border-white/5">${tool}</span>`).join('')}
                            </div>
                        </a>`).join('')}
                    </div>
                </section>`,
                `<section class="flex flex-col gap-6 text-left">
                    <div class="flex items-center gap-4 px-4 text-left"><i data-lucide="folder-git-2" class="w-5 h-5 accent-text"></i><h2 class="text-[10px] font-black uppercase tracking-[0.3em] opacity-50" style="font-family: var(--font-sans);">${t2.projects}</h2></div>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                        ${data.projects.map(p => `
                        <a href="https://github.com/${p.github}" target="_blank" class="card p-6 flex flex-col gap-4 group hover:border-accent/50 transition-all">
                            <div class="flex justify-between items-start">
                                <div class="p-2 bg-slate-800 rounded-lg"><i data-lucide="${p.icon}" class="w-5 h-5 accent-text"></i></div>
                                <i data-lucide="external-link" class="w-4 h-4 opacity-20 group-hover:opacity-100 transition-opacity"></i>
                            </div>
                            <div>
                                <h3 class="font-black text-sm uppercase tracking-tight mb-2">${p.name}</h3>
                                <p class="text-[0.75rem] opacity-60 leading-relaxed h-12 overflow-hidden">${p.description[lang2]}</p>
                            </div>
                            <div class="flex flex-wrap gap-2 mt-auto">
                                ${p.tools.map(tool => `<span class="text-[0.6rem] font-mono opacity-40 px-2 py-0.5 bg-white/5 rounded border border-white/5">${tool}</span>`).join('')}
                            </div>
                        </a>`).join('')}
                    </div>
                </section>`, 'delay-350')}

                ${flip(`
                <section class="flex flex-col gap-4 text-left reveal" style="animation-delay: 0.4s">
                    <div class="flex items-center gap-4 px-4 text-left"><i data-lucide="activity" class="w-5 h-5 accent-text"></i><h2 class="text-[10px] font-black uppercase tracking-[0.3em] opacity-50" style="font-family: var(--font-sans);">${t1.experience}</h2></div>
                    <div class="card p-12 space-y-20 text-left relative overflow-hidden" id="exp-container-fr">
                        <div class="absolute left-[59px] top-12 bottom-12 w-0.5 bg-slate-800/50 no-print">
                            <div class="timeline-progress-bar" style="height: 0%"></div>
                        </div>
                        ${data.experiences.map((exp, idx) => {
                            const expSkills = exp.details[lang].join(' ').match(/<strong>(.*?)<\/strong>/g)?.map(m => m.replace(/<\/?strong>/g, '').toLowerCase().trim()).join(' ') || '';
                            return `<div class="exp-card relative pl-14 border-l-2 border-transparent group text-left" data-skills="${expSkills}">` + 
                            `<div class="absolute -left-[11px] top-[0.4rem] w-5 h-5 rounded-full ${idx === 0 ? 'accent-bg shadow-[0_0_20px_var(--accent)]' : 'bg-slate-700'} border-[6px] border-[#18181b] transition-all group-hover:scale-125 z-20"></div>` +
                            `<div class="flex flex-col md:flex-row md:justify-between md:items-start mb-8 gap-6 text-left"><div><h3 class="text-[1.6rem] font-black text-white mb-2 tracking-tight leading-none text-left">${exp.role[lang]}</h3><div class="accent-text font-extrabold text-[1.1rem] flex items-center gap-3 opacity-90 tracking-wide uppercase text-left"><i data-lucide="building-2" class="w-5 h-5 opacity-50"></i> ${exp.company}</div></div><span class="font-mono text-[0.75rem] font-black px-5 py-2 bg-slate-800/50 rounded-xl border border-white/5 opacity-60 uppercase tracking-widest shrink-0">${exp.period}</span></div><ul class="space-y-5 text-left">${exp.details[lang].map(d => `<li class="text-[1.05rem] opacity-60 flex items-start gap-5 leading-relaxed group-hover:opacity-100 transition-opacity text-left"><span class="w-2 h-2 accent-bg rounded-full mt-2.5 shrink-0 opacity-20 group-hover:opacity-50 transition-all"></span><span>${highlightMetrics(d)}</span></li>`).join('')}</ul></div>`}).join('')}</div>
                </section>`,
                `<section class="flex flex-col gap-4 text-left">
                    <div class="flex items-center gap-4 px-4 text-left"><i data-lucide="activity" class="w-5 h-5 accent-text"></i><h2 class="text-[10px] font-black uppercase tracking-[0.3em] opacity-50" style="font-family: var(--font-sans);">${t2.experience}</h2></div>
                    <div class="card p-12 space-y-20 text-left relative overflow-hidden" id="exp-container-en">
                        <div class="absolute left-[59px] top-12 bottom-12 w-0.5 bg-slate-800/50 no-print">
                            <div class="timeline-progress-bar" style="height: 0%"></div>
                        </div>
                        ${data.experiences.map((exp, idx) => {
                            const expSkills = exp.details[lang2].join(' ').match(/<strong>(.*?)<\/strong>/g)?.map(m => m.replace(/<\/?strong>/g, '').toLowerCase().trim()).join(' ') || '';
                            return `<div class="exp-card relative pl-14 border-l-2 border-transparent group text-left" data-skills="${expSkills}">` + 
                            `<div class="absolute -left-[11px] top-[0.4rem] w-5 h-5 rounded-full ${idx === 0 ? 'accent-bg shadow-[0_0_20px_var(--accent)]' : 'bg-slate-700'} border-[6px] border-[#18181b] transition-all group-hover:scale-125 z-20"></div>` +
                            `<div class="flex flex-col md:flex-row md:justify-between md:items-start mb-8 gap-6 text-left"><div><h3 class="text-[1.6rem] font-black text-white mb-2 tracking-tight leading-none text-left">${exp.role[lang2]}</h3><div class="accent-text font-extrabold text-[1.1rem] flex items-center gap-3 opacity-90 tracking-wide uppercase text-left"><i data-lucide="building-2" class="w-5 h-5 opacity-50"></i> ${exp.company}</div></div><span class="font-mono text-[0.75rem] font-black px-5 py-2 bg-slate-800/50 rounded-xl border border-white/5 opacity-60 uppercase tracking-widest shrink-0">${exp.period}</span></div><ul class="space-y-5 text-left">${exp.details[lang2].map(d => `<li class="text-[1.05rem] opacity-60 flex items-start gap-5 leading-relaxed group-hover:opacity-100 transition-opacity text-left"><span class="w-2 h-2 accent-bg rounded-full mt-2.5 shrink-0 opacity-20 group-hover:opacity-50 transition-all"></span><span>${highlightMetrics(d)}</span></li>`).join('')}</ul></div>`}).join('')}</div>
                </section>`, 'delay-400')}
            </div>
        </div>
    </div>

    <div id="cmd-palette" onclick="toggleCmd(false)">
        <div class="cmd-box" onclick="event.stopPropagation()">
            <input type="text" class="cmd-input" id="cmd-input" placeholder="Type a command or search..." autocomplete="off">
            <div class="cmd-results" id="cmd-results"></div>
        </div>
    </div>

    <script>
        ${fs.readFileSync(path.join(__dirname, 'client.js'), 'utf8')}
    </script>
</body>
</html>`;
}

// --- GÉNÉRATEUR MARKDOWN ---
function generateMarkdown(lang) {
  const t = i18n[lang]; const c = data.contact; const stripHtml = (html) => html.replace(/<[^>]*>?/gm, '');
  let md = "# " + c.name + "\n"; md += "**" + c.title[lang] + "**\n\n"; md += "📍 " + c.location + "  \n";
  md += "📧 [" + c.email + "](mailto:" + c.email + ") | 🌐 [" + c.website + "](https://" + c.website + ")  \n";
  md += "🐙 [GitHub](https://github.com/" + c.github + ") | 🔗 [LinkedIn](https://linkedin.com/in/" + c.linkedin + ")\n\n";
  md += "## " + t.profile + "\n" + stripHtml(data.summary[lang]) + "\n\n";
  md += "## " + t.experience + "\n\n";
  data.experiences.forEach(exp => {
    md += "### " + exp.role[lang] + " | " + exp.company + "\n*" + exp.period + "*\n";
    exp.details[lang].forEach(d => md += "- " + stripHtml(d) + "\n"); md += "\n";
  });
  md += "## " + t.proSkills + "\n";
  data.skills.professional.forEach(s => { md += "- **" + s.category + "**: " + s.tools + "\n"; });
  md += "\n## " + t.certifications + "\n"; data.certifications.forEach(cert => md += "- " + cert + "\n");
  md += "\n"; return md;
}

// --- MAIN BUILD PROCESS ---
async function build() {
  const browser = await chromium.launch();
  const activity = await getGitHubActivity(data.contact.github);
  
  for (const lang of ['fr', 'en']) {
    console.log("Génération du CV en " + lang.toUpperCase() + "...");
    const htmlContent = generateHTML(lang, activity);
    const htmlPath = path.join(__dirname, "index_" + lang + ".html");
    fs.writeFileSync(htmlPath, htmlContent);
    const mdContent = generateMarkdown(lang);
    const mdFileName = lang === 'fr' ? "CV_FR.md" : "Resume_EN.md";
    fs.writeFileSync(path.join(__dirname, mdFileName), mdContent);
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'networkidle' });
    await page.waitForTimeout(500); 
    const pdfFileName = lang === 'fr' ? "CV_Thomas_Bourcey_FR.pdf" : "Resume_Thomas_Bourcey_EN.pdf";
    await page.pdf({
      path: path.join(__dirname, pdfFileName), format: 'A4', printBackground: true,
      margin: { top: '0px', right: '0px', bottom: '0px', left: '0px' }
    });
    
    // --- SOCIAL PREVIEW GENERATION ---
    console.log(`Génération de la preview Open Graph pour ${lang}...`);
    await page.setViewportSize({ width: 1200, height: 630 });
    // On attend un peu que le redimensionnement soit pris en compte (animations, layout)
    await page.waitForTimeout(500); 
    await page.screenshot({ path: path.join(__dirname, `preview_${lang}.png`) });

    await page.close();
  }
  await browser.close();
  console.log('Build terminé avec succès !');
}

build().catch(err => {
  console.error('Erreur pendant le build:', err);
  process.exit(1);
});
