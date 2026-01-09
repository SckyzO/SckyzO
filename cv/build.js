const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

// Chargement des données
const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'data.json'), 'utf8'));

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
    onboarding: "Personalize your experience here"
  }
};

// --- GÉNÉRATEUR HTML ---
function generateHTML(lang) {
  const lang2 = lang === 'fr' ? 'en' : 'fr';
  const t1 = i18n[lang];
  const t2 = i18n[lang2];
  const c = data.contact;
  const updateDate = new Date().toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US', { day: '2-digit', month: 'short', year: 'numeric' });
  const pdfFilename = lang === 'fr' ? 'CV_Thomas_Bourcey_FR.pdf' : 'Resume_Thomas_Bourcey_EN.pdf';
  
  // Helper pour générer le bloc Flip 3D
  const flip = (c1, c2, delay='') => `
    <div class="flip-container ${delay}">
        <div class="flip-card">
            <div class="flip-front">${c1}</div>
            <div class="flip-back">${c2}</div>
        </div>
    </div>`;

  return `<!DOCTYPE html>
<html lang="${lang}" class="dark" id="html-root" style="font-size: 14px;">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${c.name} - ${c.title[lang]}</title>
    <link rel="alternate" hreflang="${lang}" href="https://tomzone.fr/index_${lang}.html" />
    <link rel="alternate" hreflang="${lang2}" href="https://tomzone.fr/index_${lang2}.html" />    <meta name="description" content="${data.summary[lang].substring(0, 150).replace(/<[^>]*>/g, '')}...">
    <meta name="author" content="${c.name}">
    <meta name="keywords" content="CV, Resume, ${c.title[lang]}, DevOps, SRE, HPC, Linux">
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website">
    <meta property="og:url" content="https://tomzone.fr/index_${lang}.html">
    <meta property="og:title" content="${c.name} - ${c.title[lang]}">
    <meta property="og:description" content="${data.summary[lang].substring(0, 150).replace(/<[^>]*>/g, '')}...">
    <meta property="og:image" content="https://tomzone.fr/preview_${lang}.png">

    <!-- Twitter -->
    <meta property="twitter:card" content="summary_large_image">
    <meta property="twitter:url" content="https://tomzone.fr/index_${lang}.html">
    <meta property="twitter:title" content="${c.name} - ${c.title[lang]}">
    <meta property="twitter:description" content="${data.summary[lang].substring(0, 150).replace(/<[^>]*>/g, '')}...">
    <meta property="twitter:image" content="https://tomzone.fr/preview_${lang}.png">
    
    <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>👨‍💻</text></svg>">

    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/lucide@latest"></script>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=VT323&family=Archivo+Black&family=Inter:wght@300..900&family=JetBrains+Mono:wght@400..700&family=Geist:wght@100..900&family=Geist+Mono:wght@100..900&family=Space+Grotesk:wght@300..700&family=IBM+Plex+Mono:wght@300..700&family=Michroma&family=Fira+Code:wght@300..700&family=Montserrat:wght@100..900&family=Oxygen:wght@300..700&family=Oxygen+Mono&display=swap');
        
        :root {
            --accent: #3b82f6;
            --accent-rgba: 59, 130, 246;
            --bg-page: #09090b;
            --bg-card: #18181b;
            --border-card: rgba(255, 255, 255, 0.05);
            --text-main: #f4f4f5;
            --text-muted: #a1a1aa;
            --track-color: #3f3f46;
            --font-sans: 'Inter', sans-serif;
            --font-mono: 'JetBrains Mono', monospace;
        }

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

        html { transition: font-size 0.1s ease; scroll-behavior: smooth; }
        body { font-family: var(--font-sans); background-color: var(--bg-page); color: var(--text-main); transition: background-color 0.3s ease, color 0.3s ease; line-height: 1.6; text-align: left; }
        .mono { font-family: var(--font-mono); }
        h1, h2, h3 { font-family: var(--font-sans); font-weight: 900; }
        
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .reveal { animation: fadeInUp 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards; opacity: 0; }
        
        .card { background: var(--bg-card); border: 1px solid var(--border-card); border-radius: 1.5rem; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
        .card:hover { transform: translateY(-4px); box-shadow: 0 0 40px 5px rgba(var(--accent-rgba), 0.15); border-color: rgba(var(--accent-rgba), 0.4) !important; }

        /* --- 3D LANGUAGE FLIP (Grid Method) --- */
        .flip-container { perspective: 2000px; }
        .flip-card { 
            display: grid; grid-template-columns: 1fr; 
            transition: transform 0.8s cubic-bezier(0.4, 0, 0.2, 1); 
            transform-style: preserve-3d; 
        }
        .flip-front, .flip-back { 
            grid-area: 1 / 1; 
            backface-visibility: hidden; -webkit-backface-visibility: hidden; 
            width: 100%; 
        }
        .flip-front { transform: rotateY(0deg); z-index: 2; }
        .flip-back { transform: rotateY(180deg); z-index: 1; }
        
        /* State: Flipped */
        .flip-container.flipped .flip-card { transform: rotateY(-180deg); }
        
        /* Stagger Delays for "Wave" effect */
        .delay-100 .flip-card { transition-delay: 0.1s; }
        .delay-200 .flip-card { transition-delay: 0.2s; }
        .delay-300 .flip-card { transition-delay: 0.3s; }
        .delay-400 .flip-card { transition-delay: 0.4s; }
        .delay-500 .flip-card { transition-delay: 0.5s; }

        .accent-text { color: var(--accent); }
        .accent-bg { background-color: var(--accent); }
        .accent-border { border-color: var(--accent); }
        strong { color: var(--accent); font-weight: 700; }

        /* --- SETTINGS PANEL --- */
        #settings-panel { 
            position: fixed !important; top: 95px !important; right: 24px !important; width: 360px !important; padding: 32px !important;
            background: rgba(24, 24, 27, 0.95) !important; border: 1px solid rgba(255, 255, 255, 0.1) !important;
            border-radius: 2.5rem !important; z-index: 100 !important; box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.5) !important; backdrop-filter: blur(24px) !important;
            opacity: 0; pointer-events: none; transform: translateY(10px); transition: all 0.4s cubic-bezier(0.22, 1, 0.36, 1);
        }
        #settings-panel.open { opacity: 1 !important; pointer-events: auto !important; transform: translateY(0) !important; }
        .theme-light #settings-panel { background: rgba(255, 255, 255, 0.9) !important; border: 1px solid #e4e4e7 !important; color: #18181b !important; }
        
        #settings-panel label { font-size: 10px !important; font-weight: 900 !important; text-transform: uppercase !important; letter-spacing: 0.2em !important; opacity: 0.5 !important; margin-bottom: 16px !important; display: block; text-align: center; color: inherit; }
        
        .panel-grid { display: grid !important; grid-template-columns: repeat(3, 1fr) !important; gap: 10px !important; margin-bottom: 32px !important; }
        .font-grid { display: grid !important; grid-template-columns: repeat(4, 1fr) !important; gap: 8px !important; margin-bottom: 32px !important; }
        
        .panel-btn { 
            display: flex !important; flex-direction: column !important; align-items: center !important; justify-content: center !important; gap: 8px !important; padding: 12px !important; 
            border-radius: 1.25rem !important; font-size: 8px !important; font-weight: 800 !important; text-transform: uppercase !important;
            border: 2px solid transparent !important; transition: all 0.2s !important; background: rgba(255,255,255,0.05) !important; color: #71717a !important; cursor: pointer !important;
        }
        #btn-light { background: #f4f4f5 !important; }
        #btn-deep { background: #27272a !important; }
        #btn-dark { background: #000000 !important; }
        .panel-btn:hover { border-color: var(--accent) !important; transform: scale(1.05); }
        .panel-btn.active { border-color: var(--accent) !important; color: var(--accent) !important; ring: 4px solid rgba(var(--accent-rgba), 0.2) !important; }

        .accent-grid { display: grid !important; grid-template-columns: repeat(5, 1fr) !important; gap: 14px !important; margin-bottom: 32px !important; }
        .accent-dot { width: 36px !important; height: 36px !important; border-radius: 999px !important; cursor: pointer !important; transition: all 0.2s !important; border: 2px solid transparent !important; }
        .accent-dot:hover { transform: scale(1.1) !important; }
        .accent-dot.active { border-color: white !important; box-shadow: 0 0 15px var(--accent) !important; }

        /* PULSATING AURA */
        @keyframes aura { 0% { box-shadow: 0 0 0 0px rgba(var(--accent-rgba), 0.4); } 100% { box-shadow: 0 0 0 30px rgba(var(--accent-rgba), 0); } }
        .aura-pulse { animation: aura 2s infinite !important; border-color: var(--accent) !important; }

        /* ONBOARDING TOOLTIP */
        #onboarding-tip {
            position: fixed; top: 95px; right: 24px; z-index: 150;
            background: var(--accent); color: white; padding: 14px 24px; border-radius: 1.5rem;
            font-weight: 800; font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em;
            box-shadow: 0 10px 30px rgba(var(--accent-rgba), 0.4); pointer-events: none;
            opacity: 0; transform: translateY(10px); transition: all 0.6s cubic-bezier(0.22, 1, 0.36, 1);
        }
        #onboarding-tip.show { opacity: 1; transform: translateY(0); }
        #onboarding-tip::after { content: ""; position: absolute; top: -8px; right: 22px; border-left: 8px solid transparent; border-right: 8px solid transparent; border-bottom: 8px solid var(--accent); }

        input[type=range] { -webkit-appearance: none !important; width: 100% !important; background: transparent !important; height: 32px !important; }
        input[type=range]::-webkit-slider-runnable-track { width: 100% !important; height: 6px !important; background: var(--track-color) !important; border-radius: 3px !important; }
        input[type=range]::-webkit-slider-thumb { -webkit-appearance: none !important; height: 18px !important; width: 18px !important; border-radius: 50% !important; background: var(--accent) !important; cursor: pointer !important; margin-top: -7px !important; border: 3px solid var(--bg-card) !important; box-shadow: 0 0 15px var(--accent); }
        input[type=range]::-moz-range-track { width: 100% !important; height: 6px !important; background: var(--track-color) !important; border-radius: 3px !important; }
        input[type=range]::-moz-range-thumb { height: 18px !important; width: 18px !important; border-radius: 50% !important; background: var(--accent) !important; cursor: pointer !important; border: 3px solid var(--bg-card) !important; }

        .cog-btn {
            position: fixed !important; top: 24px !important; right: 24px !important; width: 60px !important; height: 60px !important; 
            display: flex !important; align-items: center !important; justify-content: center !important;
            background: rgba(24, 24, 27, 0.8) !important; border: 1px solid rgba(255, 255, 255, 0.1) !important;
            border-radius: 1.5rem !important; color: #a1a1aa !important; cursor: pointer !important; z-index: 101 !important; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }
        .cog-btn:hover { border-color: var(--accent); color: white !important; transform: rotate(30deg) scale(1.05); }

        /* --- TERMINAL MODE (TTY) --- */
        .mode-tty {
            --bg-page: #000000 !important;
            --bg-card: #000000 !important;
            --text-main: #33ff00 !important;
            --text-muted: #008f11 !important;
            --accent: #33ff00 !important;
            --accent-rgba: 51, 255, 0 !important;
            --border-card: #008f11 !important;
            --font-sans: 'VT323', 'Courier New', monospace !important;
            --font-mono: 'VT323', 'Courier New', monospace !important;
            cursor: text;
        }
        .mode-tty * { border-radius: 0 !important; box-shadow: none !important; text-transform: uppercase !important; letter-spacing: 0.1em !important; }
        .mode-tty .card { border: 1px solid var(--border-card) !important; background: transparent !important; }
        .mode-tty i[data-lucide] { display: none !important; } /* Hide icons in TTY */
        .mode-tty .tool-tag { border: 1px solid var(--border-card) !important; background: transparent !important; color: var(--text-main) !important; }
        .mode-tty header h1::before { content: "root@sckyzo:~# ./display_cv.sh --user="; color: var(--text-muted); font-size: 0.5em; display: block; margin-bottom: 10px; }
        .mode-tty .rounded-full, .mode-tty .rounded-2xl, .mode-tty .rounded-xl { border-radius: 0 !important; }
        
        /* CRT Scanline Effect */
        .mode-tty::before {
            content: " "; display: block; position: fixed; top: 0; left: 0; bottom: 0; right: 0;
            background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06));
            z-index: 999; background-size: 100% 2px, 3px 100%; pointer-events: none;
        }

        .tty-toggle {
            position: fixed; bottom: 24px; right: 24px; font-family: monospace; font-weight: bold;
            background: black; color: #333; border: 1px solid #333; padding: 5px 10px; font-size: 12px; cursor: pointer;
            z-index: 200; transition: all 0.3s;
        }
        .tty-toggle:hover { color: #33ff00; border-color: #33ff00; }
        .mode-tty .tty-toggle { color: #33ff00; border-color: #33ff00; box-shadow: 0 0 10px #33ff00; }

        /* --- TOGGLE SWITCH --- */
        .switch { position: relative; display: inline-block; width: 44px; height: 24px; }
        .switch input { opacity: 0; width: 0; height: 0; }
        .slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: var(--track-color); transition: .4s; border-radius: 24px; border: 1px solid var(--border-card); }
        .slider:before { position: absolute; content: ""; height: 18px; width: 18px; left: 2px; bottom: 2px; background-color: white; transition: .4s; border-radius: 50%; box-shadow: 0 2px 4px rgba(0,0,0,0.2); }
        input:checked + .slider { background-color: var(--accent); border-color: transparent; }
        input:checked + .slider:before { transform: translateX(20px); }
        input:focus + .slider { box-shadow: 0 0 1px var(--accent); }

        @media print {
            body { background-color: white !important; color: black !important; padding: 0 !important; font-family: 'Inter', sans-serif !important; }
            .no-print { display: none !important; }
            .card { background: white !important; border: 1px solid #e4e4e7 !important; box-shadow: none !important; border-radius: 0.5rem !important; }
            strong, .accent-text { color: black !important; font-weight: 800 !important; }
            .accent-bg { background-color: #000 !important; }
        }
    </style>
</head>
<body class="p-4 md:p-8 lg:p-12 theme-deep font-hub" id="body-root">
    
    <div id="onboarding-tip" class="no-print text-left">
        ${flip(`
        <div class="flex items-center gap-3">
            <i data-lucide="sparkles" class="w-4 h-4"></i>
            <span>${t1.onboarding}</span>
            <i data-lucide="arrow-up" class="w-3 h-3 opacity-50 ml-1"></i>
        </div>`,
        `<div class="flex items-center gap-3">
            <i data-lucide="sparkles" class="w-4 h-4"></i>
            <span>${t2.onboarding}</span>
            <i data-lucide="arrow-up" class="w-3 h-3 opacity-50 ml-1"></i>
        </div>`
        )}
    </div>

    <button onclick="toggleSettings()" class="cog-btn no-print" id="main-cog"><i data-lucide="settings" style="width: 28px; height: 28px;"></i></button>

    <div id="settings-panel" class="no-print">
        <label>Appearance</label>
        <div class="panel-grid">
            <button onclick="setTheme('light')" class="panel-btn" id="btn-light"><i data-lucide="sun" class="w-4 h-4"></i><span>Light</span></button>
            <button onclick="setTheme('deep')" class="panel-btn" id="btn-deep"><i data-lucide="moon" class="w-4 h-4"></i><span>Deep</span></button>
            <button onclick="setTheme('dark')" class="panel-btn" id="btn-dark"><i data-lucide="zap" class="w-4 h-4"></i><span>Dark</span></button>
        </div>
        <label>Accent Color</label>
        <div class="accent-grid" id="accent-picker"></div>
        <label>Data Scaling</label>
        <div class="flex items-center gap-4 px-2 mb-10 text-white">
            <span style="font-size: 12px !important; color: inherit;" class="font-serif italic opacity-40">a</span>
            <input type="range" min="12" max="20" value="14" step="1" oninput="setFontSize(this.value)" class="flex-grow">
            <span style="font-size: 20px !important; color: inherit;" class="font-serif italic opacity-40">A</span>
        </div>
        <label>System Mode</label>
        <div class="px-2 mb-10 flex items-center justify-between group cursor-pointer" onclick="document.getElementById('tty-checkbox').click()">
            <div class="flex items-center gap-3 opacity-60 group-hover:opacity-100 transition-opacity">
                <i data-lucide="terminal" class="w-4 h-4"></i>
                <span class="text-[10px] font-black uppercase tracking-widest leading-none">CRT Terminal</span>
            </div>
            <label class="switch" onclick="event.stopPropagation()" style="margin-bottom: 0;">
                <input type="checkbox" id="tty-checkbox" onchange="toggleTTY()">
                <span class="slider"></span>
            </label>
        </div>
        <label>Font Stack</label>
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
            <div class="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity text-left"><i data-lucide="box" style="width: 300px; height: 300px;"></i></div>
            <div class="w-40 h-40 bg-slate-800/20 rounded-[2.5rem] flex items-center justify-center border-2 accent-border relative shrink-0">
                <i data-lucide="user" class="w-20 h-20 accent-text"></i>
                <div class="absolute -bottom-2 -right-2 w-8 h-8 accent-bg border-[6px] border-[#18181b] rounded-full animate-pulse shadow-[0_0_20px_var(--accent)]"></div>
            </div>
            <div class="text-center md:text-left flex-grow text-left">
                <h1 class="text-5xl md:text-6xl font-black tracking-tighter uppercase italic mb-4 leading-none" style="font-family: var(--font-sans);">${c.name}</h1>
                <p class="accent-text font-mono text-lg font-bold uppercase tracking-[0.3em] mb-8 text-left">${c.title[lang]}</p>
                <div class="flex flex-wrap justify-center md:justify-start gap-4 no-print text-left">
                    <button onclick="toggleLanguage()" class="card px-6 py-3 rounded-2xl font-black text-xs tracking-widest hover:scale-105 hover:accent-border flex items-center gap-3 transition-all" title="Switch Language (Flip)">
                        <span class="text-lg">${lang === 'fr' ? '🇺🇸' : '🇫🇷'}</span> SWITCH
                    </button>
                    <a href="${pdfFilename}" download class="accent-bg text-slate-950 px-8 py-3 rounded-2xl font-black text-xs tracking-widest transition-all hover:scale-105 shadow-xl shadow-cyan-500/10 flex items-center gap-3"><i data-lucide="download" class="w-4 h-4"></i> DOWNLOAD PDF</a>
                    <a href="https://github.com/${c.github}" target="_blank" class="p-3 card hover:accent-border"><i data-lucide="github" class="w-5 h-5"></i></a>
                    <a href="https://linkedin.com/in/${c.linkedin}" target="_blank" class="p-3 card hover:accent-border"><i data-lucide="linkedin" class="w-5 h-5"></i></a>
                </div>
            </div>
            <div class="hidden lg:flex flex-col gap-4 text-right opacity-40 font-mono text-[10px] uppercase tracking-[0.2em]"><span>Status: system_ready</span><span>Uptime: 15y_experience</span><span>Sync: ${updateDate}</span></div>
        </header>`, 
        `
        <header class="card p-10 md:p-16 flex flex-col md:flex-row items-center gap-12 relative overflow-hidden group">
            <div class="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity text-left"><i data-lucide="box" style="width: 300px; height: 300px;"></i></div>
            <div class="w-40 h-40 bg-slate-800/20 rounded-[2.5rem] flex items-center justify-center border-2 accent-border relative shrink-0">
                <i data-lucide="user" class="w-20 h-20 accent-text"></i>
                <div class="absolute -bottom-2 -right-2 w-8 h-8 accent-bg border-[6px] border-[#18181b] rounded-full animate-pulse shadow-[0_0_20px_var(--accent)]"></div>
            </div>
            <div class="text-center md:text-left flex-grow text-left">
                <h1 class="text-5xl md:text-6xl font-black tracking-tighter uppercase italic mb-4 leading-none" style="font-family: var(--font-sans);">${c.name}</h1>
                <p class="accent-text font-mono text-lg font-bold uppercase tracking-[0.3em] mb-8 text-left">${c.title[lang2]}</p>
                <div class="flex flex-wrap justify-center md:justify-start gap-4 no-print text-left">
                    <button onclick="toggleLanguage()" class="card px-6 py-3 rounded-2xl font-black text-xs tracking-widest hover:scale-105 hover:accent-border flex items-center gap-3 transition-all">
                        <span class="text-lg">${lang === 'fr' ? '🇫🇷' : '🇺🇸'}</span> RETOUR
                    </button>
                    <a href="${lang === 'fr' ? 'Resume_Thomas_Bourcey_EN.pdf' : 'CV_Thomas_Bourcey_FR.pdf'}" download class="accent-bg text-slate-950 px-8 py-3 rounded-2xl font-black text-xs tracking-widest transition-all hover:scale-105 shadow-xl shadow-cyan-500/10 flex items-center gap-3"><i data-lucide="download" class="w-4 h-4"></i> DOWNLOAD PDF</a>
                </div>
            </div>
            <div class="hidden lg:flex flex-col gap-4 text-right opacity-40 font-mono text-[10px] uppercase tracking-[0.2em]"><span>Status: system_ready</span><span>Uptime: 15y_experience</span><span>Sync: ${updateDate}</span></div>
        </header>`
        )}

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start text-left">
            <div class="lg:col-span-4 flex flex-col gap-12 text-left">
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
                    <div class="card p-12 text-left"><p class="text-[1.15rem] leading-relaxed opacity-80 font-medium text-left" style="text-wrap: balance;">${data.summary[lang]}</p></div>
                </section>`,
                `<section class="flex flex-col gap-4 text-left">
                    <div class="flex items-center gap-4 px-4 text-left"><i data-lucide="terminal" class="w-5 h-5 accent-text"></i><h2 class="text-[10px] font-black uppercase tracking-[0.3em] opacity-50" style="font-family: var(--font-sans);">${t2.profile}</h2></div>
                    <div class="card p-12 text-left"><p class="text-[1.15rem] leading-relaxed opacity-80 font-medium text-left" style="text-wrap: balance;">${data.summary[lang2]}</p></div>
                </section>`, 'delay-200')}

                ${flip(`
                <section class="flex flex-col gap-6 text-left reveal" style="animation-delay: 0.2s">
                    <div class="flex items-center gap-4 px-4 text-left"><i data-lucide="cpu" class="w-5 h-5 accent-text"></i><h2 class="text-[10px] font-black uppercase tracking-[0.3em] opacity-50" style="font-family: var(--font-sans);">${t1.proSkills}</h2></div>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">${data.skills.professional.map((s, i) => `<div class="card p-8 flex flex-col gap-6 group hover:scale-[1.02] text-left reveal" style="animation-delay: ${0.2 + (i * 0.05)}s"><div class="flex justify-between items-center text-left"><div class="flex items-center gap-4 text-left"><div class="p-2 bg-slate-800 rounded-xl border border-white/10 group-hover:accent-border transition-colors"><i data-lucide="${s.icon || 'cpu'}" class="w-5 h-5 accent-text"></i></div><span class="text-[1rem] font-black uppercase tracking-widest text-white group-hover:accent-text transition-colors">${s.category}</span></div></div><div class="flex flex-wrap gap-2.5 text-left">${s.tools.split(', ').map(tool => `<span class="tool-tag px-3.5 py-1.5 bg-black/40 border border-white/5 rounded-xl text-[0.85rem] font-mono text-slate-400 hover:text-white hover:border-accent/30 transition-all flex items-center gap-2 cursor-default text-left"><span class="tool-dot w-1.5 h-1.5 accent-bg opacity-30 rounded-full transition-all"></span>${tool}</span>`).join('')}</div></div>`).join('')}</div>
                </section>`,
                `<section class="flex flex-col gap-6 text-left">
                    <div class="flex items-center gap-4 px-4 text-left"><i data-lucide="cpu" class="w-5 h-5 accent-text"></i><h2 class="text-[10px] font-black uppercase tracking-[0.3em] opacity-50" style="font-family: var(--font-sans);">${t2.proSkills}</h2></div>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">${data.skills.professional.map((s, i) => `<div class="card p-8 flex flex-col gap-6 group hover:scale-[1.02] text-left"><div class="flex justify-between items-center text-left"><div class="flex items-center gap-4 text-left"><div class="p-2 bg-slate-800 rounded-xl border border-white/10 group-hover:accent-border transition-colors"><i data-lucide="${s.icon || 'cpu'}" class="w-5 h-5 accent-text"></i></div><span class="text-[1rem] font-black uppercase tracking-widest text-white group-hover:accent-text transition-colors">${s.category}</span></div></div><div class="flex flex-wrap gap-2.5 text-left">${s.tools.split(', ').map(tool => `<span class="tool-tag px-3.5 py-1.5 bg-black/40 border border-white/5 rounded-xl text-[0.85rem] font-mono text-slate-400 hover:text-white hover:border-accent/30 transition-all flex items-center gap-2 cursor-default text-left"><span class="tool-dot w-1.5 h-1.5 accent-bg opacity-30 rounded-full transition-all"></span>${tool}</span>`).join('')}</div></div>`).join('')}</div>
                </section>`, 'delay-300')}

                ${flip(`
                <section class="flex flex-col gap-4 text-left reveal" style="animation-delay: 0.4s">
                    <div class="flex items-center gap-4 px-4 text-left"><i data-lucide="activity" class="w-5 h-5 accent-text"></i><h2 class="text-[10px] font-black uppercase tracking-[0.3em] opacity-50" style="font-family: var(--font-sans);">${t1.experience}</h2></div>
                    <div class="card p-12 space-y-20 text-left">${data.experiences.map((exp, idx) => `<div class="relative pl-14 border-l-2 border-slate-800/50 group text-left"><div class="absolute -left-[11px] top-[0.4rem] w-5 h-5 rounded-full ${idx === 0 ? 'accent-bg shadow-[0_0_20px_var(--accent)]' : 'bg-slate-700'} border-[6px] border-[#18181b] transition-all group-hover:scale-125"></div><div class="flex flex-col md:flex-row md:justify-between md:items-start mb-8 gap-6 text-left"><div><h3 class="text-[1.6rem] font-black text-white mb-2 tracking-tight leading-none text-left">${exp.role[lang]}</h3><div class="accent-text font-extrabold text-[1.1rem] flex items-center gap-3 opacity-90 tracking-wide uppercase text-left"><i data-lucide="building-2" class="w-5 h-5 opacity-50"></i> ${exp.company}</div></div><span class="font-mono text-[0.75rem] font-black px-5 py-2 bg-slate-800/50 rounded-xl border border-white/5 opacity-60 uppercase tracking-widest shrink-0">${exp.period}</span></div><ul class="space-y-5 text-left">${exp.details[lang].map(d => `<li class="text-[1.05rem] opacity-60 flex items-start gap-5 leading-relaxed group-hover:opacity-100 transition-opacity text-left"><span class="w-2 h-2 accent-bg rounded-full mt-2.5 shrink-0 opacity-20 group-hover:opacity-50 transition-all"></span><span>${d}</span></li>`).join('')}</ul></div>`).join('')}</div>
                </section>`,
                `<section class="flex flex-col gap-4 text-left">
                    <div class="flex items-center gap-4 px-4 text-left"><i data-lucide="activity" class="w-5 h-5 accent-text"></i><h2 class="text-[10px] font-black uppercase tracking-[0.3em] opacity-50" style="font-family: var(--font-sans);">${t2.experience}</h2></div>
                    <div class="card p-12 space-y-20 text-left">${data.experiences.map((exp, idx) => `<div class="relative pl-14 border-l-2 border-slate-800/50 group text-left"><div class="absolute -left-[11px] top-[0.4rem] w-5 h-5 rounded-full ${idx === 0 ? 'accent-bg shadow-[0_0_20px_var(--accent)]' : 'bg-slate-700'} border-[6px] border-[#18181b] transition-all group-hover:scale-125"></div><div class="flex flex-col md:flex-row md:justify-between md:items-start mb-8 gap-6 text-left"><div><h3 class="text-[1.6rem] font-black text-white mb-2 tracking-tight leading-none text-left">${exp.role[lang2]}</h3><div class="accent-text font-extrabold text-[1.1rem] flex items-center gap-3 opacity-90 tracking-wide uppercase text-left"><i data-lucide="building-2" class="w-5 h-5 opacity-50"></i> ${exp.company}</div></div><span class="font-mono text-[0.75rem] font-black px-5 py-2 bg-slate-800/50 rounded-xl border border-white/5 opacity-60 uppercase tracking-widest shrink-0">${exp.period}</span></div><ul class="space-y-5 text-left">${exp.details[lang2].map(d => `<li class="text-[1.05rem] opacity-60 flex items-start gap-5 leading-relaxed group-hover:opacity-100 transition-opacity text-left"><span class="w-2 h-2 accent-bg rounded-full mt-2.5 shrink-0 opacity-20 group-hover:opacity-50 transition-all"></span><span>${d}</span></li>`).join('')}</ul></div>`).join('')}</div>
                </section>`, 'delay-400')}
            </div>
        </div>
    </div>

    <button onclick="toggleTTY()" class="tty-toggle no-print" title="Toggle Terminal Mode (CTRL+ALT+T)">>_ TTY</button>

    <script>
        const colors = [ { name: 'Blue', value: '59, 130, 246', hex: '#3b82f6' }, { name: 'Emerald', value: '16, 185, 129', hex: '#10b981' }, { name: 'Violet', value: '139, 92, 246', hex: '#8b5cf6' }, { name: 'Amber', value: '245, 158, 11', hex: '#f5a623' }, { name: 'Rose', value: '244, 63, 94', hex: '#f43f5e' }, { name: 'Sky', value: '14, 165, 233', hex: '#0ea5e9' }, { name: 'Orange', value: '249, 115, 22', hex: '#f97316' }, { name: 'Teal', value: '20, 184, 166', hex: '#14b8a6' }, { name: 'Cyan', value: '6, 182, 212', hex: '#06b6d4' }, { name: 'Fuchsia', value: '217, 70, 239', hex: '#d946ef' } ];
        lucide.createIcons();
        function toggleLanguage() {
            document.querySelectorAll('.flip-container').forEach(el => el.classList.toggle('flipped'));
        }
        function toggleSettings() { document.getElementById('settings-panel').classList.toggle('open'); document.getElementById('onboarding-tip').classList.remove('show'); document.getElementById('main-cog').classList.remove('aura-pulse'); }
        function toggleTTY() { 
            const checkbox = document.getElementById('tty-checkbox');
            const isChecked = checkbox.checked;
            
            // Si l'appel vient du raccourci clavier ou du bouton flottant, on inverse manuellement
            if (arguments.length === 0 || typeof arguments[0] !== 'object') {
                // Cette partie est appelée par le raccourci ou le bouton flottant
                // mais PAS par le onchange de la checkbox lui-même
            }

            document.body.classList.toggle('mode-tty', isChecked); 
            localStorage.setItem('cv-tty', isChecked);
        }
        
        // Nouvelle version de la fonction pour gérer les sources multiples (clic, switch, clavier)
        function updateTTY(forceState = null) {
            const checkbox = document.getElementById('tty-checkbox');
            const newState = (forceState !== null) ? forceState : !document.body.classList.contains('mode-tty');
            
            document.body.classList.toggle('mode-tty', newState);
            if (checkbox) checkbox.checked = newState;
            localStorage.setItem('cv-tty', newState);
        }

        // On remplace l'ancienne fonction par la nouvelle logique
        window.toggleTTY = () => updateTTY();

        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.altKey && e.key === 't') updateTTY();
        });
        
        if (localStorage.getItem('cv-tty') === 'true') { 
            document.body.classList.add('mode-tty');
            window.addEventListener('DOMContentLoaded', () => {
                const cb = document.getElementById('tty-checkbox');
                if (cb) cb.checked = true;
            });
        }

        function setTheme(t) { 
            const b = document.getElementById('body-root'); b.classList.remove('theme-light', 'theme-deep', 'theme-dark'); b.classList.add('theme-' + t); localStorage.setItem('cv-theme', t);
            document.querySelectorAll('.panel-btn').forEach(btn => { if(btn.id.startsWith('btn-')) btn.classList.toggle('active', btn.id === 'btn-' + t); });
        }
        function setAccent(hex) {
            const color = colors.find(c => c.hex === hex); document.documentElement.style.setProperty('--accent', hex); document.documentElement.style.setProperty('--accent-rgba', color.value);
            localStorage.setItem('cv-accent', hex); document.querySelectorAll('.accent-dot').forEach(dot => { dot.classList.toggle('active', dot.getAttribute('data-hex') === hex); });
        }
        function setFontSize(s) { document.getElementById('html-root').style.fontSize = s + 'px'; localStorage.setItem('cv-font-size', s); }
        function setFontStack(f) {
            const b = document.getElementById('body-root'); b.classList.remove('font-hub', 'font-geist', 'font-space', 'font-archivo', 'font-quantum', 'font-console', 'font-architect', 'font-oxy');
            b.classList.add('font-' + f); localStorage.setItem('cv-font-stack', f); document.querySelectorAll('.font-btn').forEach(btn => { btn.classList.toggle('active', btn.id === 'f-' + f); });
        }
        const picker = document.getElementById('accent-picker');
        colors.forEach(c => {
            const btn = document.createElement('button'); btn.className = 'accent-dot'; btn.style.backgroundColor = c.hex;
            btn.setAttribute('data-hex', c.hex); btn.onclick = () => setAccent(c.hex); picker.appendChild(btn);
        });
        const savedTheme = localStorage.getItem('cv-theme') || 'deep'; const savedAccent = localStorage.getItem('cv-accent') || '#3b82f6';
        const savedFontSize = localStorage.getItem('cv-font-size') || '14'; const savedFontStack = localStorage.getItem('cv-font-stack') || 'hub';
        setTheme(savedTheme); setAccent(savedAccent); setFontSize(savedFontSize); setFontStack(savedFontStack);
        document.querySelector('input[type=range]').value = savedFontSize;
        if (!localStorage.getItem('cv-visited')) {
            const tip = document.getElementById('onboarding-tip'); const cog = document.getElementById('main-cog');
            setTimeout(() => { tip.classList.add('show'); cog.classList.add('aura-pulse'); }, 1000);
            setTimeout(() => { tip.classList.remove('show'); cog.classList.remove('aura-pulse'); localStorage.setItem('cv-visited', 'true'); }, 10000);
        }
        window.onclick = function(e) {
            const p = document.getElementById('settings-panel'); const btn = document.querySelector('.cog-btn');
            if (p.classList.contains('open') && !p.contains(e.target) && !btn.contains(e.target)) toggleSettings();
        }
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
  for (const lang of ['fr', 'en']) {
    console.log("Génération du CV en " + lang.toUpperCase() + "...");
    const htmlContent = generateHTML(lang);
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
