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
    proSkills: "Compétences"
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
    proSkills: "Professional Skills"
  }
};

// --- GÉNÉRATEUR HTML ---
function generateHTML(lang) {
  const t = i18n[lang];
  const c = data.contact;
  const updateDate = new Date().toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US', { day: '2-digit', month: 'short', year: 'numeric' });
  
  return `<!DOCTYPE html>
<html lang="${lang}" class="dark" id="html-root" style="font-size: 14px;">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${c.name} - ${t.profile} (${lang.toUpperCase()})</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/lucide@latest"></script>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Archivo+Black&family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500&display=swap');
        
        :root {
            --accent: #3b82f6;
            --accent-rgba: 59, 130, 246;
            --bg-page: #09090b;
            --bg-card: #18181b;
            --border-card: rgba(255, 255, 255, 0.05);
            --text-main: #f4f4f5;
            --text-muted: #a1a1aa;
        }

        /* Themes matching monitoring-hub */
        .theme-light {
            --bg-page: #f4f4f5;
            --bg-card: #ffffff;
            --border-card: #e4e4e7;
            --text-main: #18181b;
            --text-muted: #52525b;
        }
        .theme-deep {
            --bg-page: #09090b;
            --bg-card: #18181b;
            --border-card: rgba(255, 255, 255, 0.05);
            --text-main: #f4f4f5;
            --text-muted: #a1a1aa;
        }
        .theme-dark {
            --bg-page: #000000;
            --bg-card: #09090b;
            --border-card: rgba(255, 255, 255, 0.05);
            --text-main: #f4f4f5;
            --text-muted: #a1a1aa;
        }

        html { transition: font-size 0.1s ease; scroll-behavior: smooth; }

        body { 
            font-family: 'Inter', sans-serif; 
            background-color: var(--bg-page);
            color: var(--text-main);
            transition: background-color 0.3s ease, color 0.3s ease;
            line-height: 1.6;
        }

        .mono { font-family: 'JetBrains Mono', monospace; }
        
        .card {
            background: var(--bg-card);
            border: 1px solid var(--border-card);
            border-radius: 1.5rem;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        /* Hover Glow Effect from monitoring-hub */
        .card:hover {
            transform: translateY(-4px);
            box-shadow: 0 0 40px 5px rgba(var(--accent-rgba), 0.15);
            border-color: rgba(var(--accent-rgba), 0.4) !important;
        }

        .accent-text { color: var(--accent); }
        .accent-bg { background-color: var(--accent); }
        .accent-border { border-color: var(--accent); }

        strong { color: var(--accent); font-weight: 700; }

        /* Stable Settings Panel */
        #settings-panel { 
            display: none; 
            position: fixed !important;
            top: 80px !important;
            right: 24px !important;
            width: 300px !important;
            padding: 24px !important;
            background: rgba(24, 24, 27, 0.95) !important;
            border: 1px solid rgba(255, 255, 255, 0.1) !important;
            border-radius: 1.5rem !important;
            z-index: 100 !important;
            box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.5) !important;
            backdrop-filter: blur(16px) !important;
            font-size: 14px !important;
        }
        #settings-panel.open { display: block !important; }
        #settings-panel label { font-size: 10px !important; font-weight: 800 !important; text-transform: uppercase !important; letter-spacing: 0.1em !important; opacity: 0.5 !important; margin-bottom: 12px !important; display: block !important; text-align: center !important; color: white !important; }
        
        .panel-grid { display: grid !important; grid-template-columns: repeat(3, 1fr) !important; gap: 8px !important; margin-bottom: 24px !important; }
        .panel-btn { background: rgba(255, 255, 255, 0.05) !important; border: 1px solid rgba(255, 255, 255, 0.1) !important; border-radius: 0.75rem !important; padding: 10px !important; font-size: 9px !important; font-weight: 800 !important; color: #a1a1aa !important; cursor: pointer !important; transition: all 0.2s !important; }
        .panel-btn:hover { border-color: var(--accent) !important; color: white !important; }
        .panel-btn.active { border-color: var(--accent) !important; color: var(--accent) !important; background: rgba(var(--accent-rgba), 0.1) !important; }

        .accent-grid { display: grid !important; grid-template-columns: repeat(5, 1fr) !important; gap: 12px !important; margin-bottom: 24px !important; }
        .accent-dot { width: 32px !important; height: 32px !important; border-radius: 999px !important; cursor: pointer !important; transition: all 0.2s !important; border: 2px solid transparent !important; }
        .accent-dot:hover { transform: scale(1.1) !important; }
        .accent-dot.active { border-color: white !important; box-shadow: 0 0 15px var(--accent); }

        input[type=range] { -webkit-appearance: none !important; width: 100% !important; background: transparent !important; }
        input[type=range]::-webkit-slider-runnable-track { width: 100% !important; height: 4px !important; background: rgba(255,255,255,0.1) !important; border-radius: 2px !important; }
        input[type=range]::-webkit-slider-thumb { -webkit-appearance: none !important; height: 16px !important; width: 16px !important; border-radius: 50% !important; background: var(--accent) !important; cursor: pointer !important; margin-top: -6px !important; border: 2px solid #18181b !important; box-shadow: 0 0 10px var(--accent); }

        .cog-btn {
            position: fixed !important; top: 24px !important; right: 24px !important; width: 48px !important; height: 48px !important; 
            display: flex !important; align-items: center !important; justify-content: center !important;
            background: rgba(24, 24, 27, 0.8) !important; border: 1px solid rgba(255, 255, 255, 0.1) !important;
            border-radius: 1rem !important; color: #a1a1aa !important; cursor: pointer !important; z-index: 101 !important; transition: all 0.2s !important;
        }
        .cog-btn:hover { border-color: var(--accent); color: white !important; transform: rotate(30deg); }

        @media print {
            body { background-color: white !important; color: black !important; padding: 0 !important; }
            .no-print { display: none !important; }
            .card { background: white !important; border: 1px solid #e4e4e7 !important; box-shadow: none !important; border-radius: 0.5rem !important; }
            strong, .accent-text { color: black !important; font-weight: 800 !important; }
            .accent-bg { background-color: #000 !important; }
        }
    </style>
</head>
<body class="p-4 md:p-8 lg:p-12 theme-deep" id="body-root">
    
    <button onclick="toggleSettings()" class="cog-btn no-print"><i data-lucide="settings" style="width: 22px; height: 22px;"></i></button>

    <div id="settings-panel" class="no-print">
        <label>Appearance</label>
        <div class="panel-grid">
            <button onclick="setTheme('light')" class="panel-btn">LIGHT</button>
            <button onclick="setTheme('deep')" class="panel-btn">DEEP</button>
            <button onclick="setTheme('dark')" class="panel-btn">OLED</button>
        </div>

        <label>Accent Channel</label>
        <div class="accent-grid" id="accent-picker">
            <!-- Populated by script -->
        </div>

        <label>Data Scaling</label>
        <div class="flex items-center gap-4 px-2">
            <span style="font-size: 12px !important; color: white !important;" class="font-serif italic opacity-40">a</span>
            <input type="range" min="12" max="20" value="14" step="1" oninput="setFontSize(this.value)">
            <span style="font-size: 20px !important; color: white !important;" class="font-serif italic opacity-40">A</span>
        </div>
    </div>

    <div class="max-w-7xl mx-auto flex flex-col gap-8">
        
        <!-- Header / Identity Card -->
        <header class="card p-10 md:p-16 flex flex-col md:flex-row items-center gap-12 relative overflow-hidden group">
            <div class="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
                <i data-lucide="box" style="width: 300px; height: 300px;"></i>
            </div>
            <div class="w-40 h-40 bg-slate-800/20 rounded-[2.5rem] flex items-center justify-center border-2 accent-border relative shrink-0">
                <i data-lucide="user" class="w-20 h-20 accent-text"></i>
                <div class="absolute -bottom-2 -right-2 w-8 h-8 accent-bg border-[6px] border-[#18181b] rounded-full animate-pulse shadow-[0_0_20px_var(--accent)]"></div>
            </div>
            <div class="text-center md:text-left flex-grow">
                <h1 class="text-5xl md:text-6xl font-black tracking-tighter uppercase italic mb-4" style="font-family: 'Archivo Black', sans-serif;">${c.name}</h1>
                <p class="accent-text font-mono text-lg font-bold uppercase tracking-[0.3em] mb-8">${c.title[lang]}</p>
                <div class="flex flex-wrap justify-center md:justify-start gap-4 no-print">
                    <button onclick="window.print()" class="accent-bg text-slate-950 px-8 py-3 rounded-2xl font-black text-xs tracking-widest transition-all hover:scale-105 active:scale-95 shadow-xl shadow-cyan-500/10 flex items-center gap-3">
                        <i data-lucide="printer" class="w-4 h-4"></i> ${t.print}
                    </button>
                    <a href="https://github.com/${c.github}" target="_blank" class="p-3 card hover:accent-border"><i data-lucide="github" class="w-5 h-5"></i></a>
                    <a href="https://linkedin.com/in/${c.linkedin}" target="_blank" class="p-3 card hover:accent-border"><i data-lucide="linkedin" class="w-5 h-5"></i></a>
                </div>
            </div>
            <div class="hidden lg:flex flex-col gap-4 text-right opacity-40 font-mono text-[10px] uppercase tracking-[0.2em]">
                <span>Status: system_ready</span>
                <span>Uptime: 15y_experience</span>
                <span>Locale: ${lang.toUpperCase()}</span>
                <span>Sync: ${updateDate}</span>
            </div>
        </header>

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            <!-- LEFT COLUMN -->
            <div class="lg:col-span-4 flex flex-col gap-8">
                <div class="card p-10">
                    <h2 class="text-[0.7rem] font-black uppercase tracking-[0.3em] text-slate-500 mb-8 flex items-center gap-3">
                        <span class="w-2 h-2 accent-bg rounded-sm rotate-45"></span> ${t.contact}
                    </h2>
                    <ul class="space-y-6 text-[0.95rem] font-mono opacity-80">
                        <li class="flex items-center gap-4"><i data-lucide="mail" class="w-5 h-5 accent-text opacity-50"></i><a href="mailto:${c.email}" class="hover:accent-text transition-colors truncate">${c.email}</a></li>
                        <li class="flex items-center gap-4"><i data-lucide="globe" class="w-5 h-5 accent-text opacity-50"></i><span>${c.website}</span></li>
                        <li class="flex items-center gap-4"><i data-lucide="map-pin" class="w-5 h-5 accent-text opacity-50"></i><span>${c.location}</span></li>
                    </ul>
                </div>

                <div class="card p-10">
                    <h2 class="text-[0.7rem] font-black uppercase tracking-[0.3em] text-slate-500 mb-8 flex items-center gap-3">
                        <span class="w-2 h-2 accent-bg rounded-sm rotate-45"></span> ${t.languages}
                    </h2>
                    <div class="space-y-8">
                        ${data.languages[lang].map(l => `
                        <div>
                            <div class="flex justify-between mb-3 font-bold text-sm">
                                <span class="uppercase tracking-widest">${l.name}</span>
                                <span class="accent-text opacity-50 italic font-mono text-[0.7rem]">${l.level}</span>
                            </div>
                            <div class="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                                <div class="accent-bg h-full opacity-80" style="width: ${l.name.includes('rançais') || l.name.includes('rench') ? '100%' : '75%'}"></div>
                            </div>
                        </div>`).join('')}
                    </div>
                </div>

                <div class="card p-10">
                    <h2 class="text-[0.7rem] font-black uppercase tracking-[0.3em] text-slate-500 mb-8 flex items-center gap-3">
                        <span class="w-2 h-2 accent-bg rounded-sm rotate-45"></span> ${t.skills}
                    </h2>
                    <div class="flex flex-wrap gap-2.5">
                        ${data.skills.personal[lang].map(s => `<span class="px-4 py-2 bg-slate-800/50 text-[0.7rem] font-black rounded-xl border border-white/5 uppercase hover:accent-border transition-all cursor-default">${s}</span>`).join('')}
                    </div>
                </div>
            </div>

            <!-- RIGHT COLUMN -->
            <div class="lg:col-span-8 flex flex-col gap-8">
                <section class="card p-12">
                    <h2 class="text-[0.7rem] font-black uppercase tracking-[0.4em] text-slate-500 mb-8 flex items-center gap-4">
                        <span class="px-2 py-0.5 bg-slate-800 rounded border border-white/5 accent-text">01</span> ${t.profile}
                    </h2>
                    <p class="text-[1.15rem] leading-relaxed opacity-80 max-w-4xl font-medium" style="text-wrap: balance;">${data.summary[lang]}</p>
                </section>

                <section class="card p-12">
                    <h2 class="text-[0.7rem] font-black uppercase tracking-[0.4em] text-slate-500 mb-12 flex items-center gap-4">
                        <span class="px-2 py-0.5 bg-slate-800 rounded border border-white/5 accent-text">02</span> ${t.proSkills}
                    </h2>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        ${data.skills.professional.map(s => `
                        <div class="card bg-slate-900/30 border-white/5 p-8 group hover:bg-slate-800/40">
                            <div class="flex items-center gap-4 mb-6">
                                <div class="p-2 bg-slate-800 rounded-xl border border-white/10 group-hover:accent-border transition-colors">
                                    <i data-lucide="${s.icon || 'cpu'}" class="w-5 h-5 accent-text"></i>
                                </div>
                                <span class="text-[0.95rem] font-black uppercase tracking-widest">${s.category}</span>
                            </div>
                            <div class="flex flex-wrap gap-2.5">
                                ${s.tools.split(', ').map(tool => `
                                    <span class="px-3 py-1.5 bg-black/40 border border-white/5 rounded-lg text-[0.8rem] font-mono text-slate-400 group-hover:text-white group-hover:border-accent/20 transition-all flex items-center gap-2">
                                        <span class="w-1 h-1 accent-bg opacity-30 group-hover:opacity-100 rounded-full"></span>
                                        ${tool}
                                    </span>
                                `).join('')}
                            </div>
                        </div>`).join('')}
                    </div>
                </section>

                <section class="card p-12">
                    <h2 class="text-[0.7rem] font-black uppercase tracking-[0.4em] text-slate-500 mb-12 flex items-center gap-4">
                        <span class="px-2 py-0.5 bg-slate-800 rounded border border-white/5 accent-text">03</span> ${t.experience}
                    </h2>
                    <div class="space-y-16">
                        ${data.experiences.map((exp, idx) => `
                        <div class="relative pl-14 border-l-2 border-slate-800/50 group">
                            <div class="absolute -left-[11px] top-[0.4rem] w-5 h-5 rounded-full ${idx === 0 ? 'accent-bg shadow-[0_0_20px_var(--accent)]' : 'bg-slate-700'} border-[6px] border-var-bg transition-all group-hover:scale-125"></div>
                            
                            <div class="flex flex-col md:flex-row md:justify-between md:items-start mb-8 gap-6">
                                <div>
                                    <h3 class="text-[1.5rem] font-black text-white mb-2 tracking-tight">${exp.role[lang]}</h3>
                                    <div class="accent-text font-extrabold text-[1.05rem] flex items-center gap-3 opacity-90 tracking-wide">
                                        <i data-lucide="building-2" class="w-5 h-5 opacity-50"></i> ${exp.company}
                                    </div>
                                </div>
                                <span class="font-mono text-[0.75rem] font-black px-5 py-2 bg-slate-800/50 rounded-xl border border-white/5 opacity-60 uppercase tracking-widest shrink-0">${exp.period}</span>
                            </div>
                            <ul class="space-y-5">
                                ${exp.details[lang].map(d => `
                                <li class="text-[1.05rem] opacity-60 flex items-start gap-5 leading-relaxed group-hover:opacity-100 transition-opacity">
                                    <span class="w-2 h-2 accent-bg rounded-full mt-2.5 shrink-0 opacity-20 group-hover:opacity-50 transition-all"></span>
                                    <span>${d}</span>
                                </li>`).join('')}
                            </ul>
                        </div>`).join('')}
                    </div>
                </section>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <section class="card p-12">
                        <h2 class="text-[0.7rem] font-black uppercase tracking-[0.4em] text-slate-500 mb-10 flex items-center gap-4">
                            <span class="px-2 py-0.5 bg-slate-800 rounded border border-white/5 accent-text">04</span> ${t.education}
                        </h2>
                        <div class="space-y-8">
                            ${data.education.map(ed => `
                            <div class="flex justify-between items-start gap-6">
                                <div>
                                    <p class="text-[1rem] font-black text-white uppercase tracking-tight mb-1">${ed.degree[lang]}</p>
                                    <p class="text-[0.85rem] opacity-40 italic font-mono">${ed.school}</p>
                                </div>
                                <span class="text-[0.9rem] font-bold text-slate-500 shrink-0">${ed.year}</span>
                            </div>`).join('')}
                        </div>
                    </section>
                    <section class="card p-12">
                        <h2 class="text-[0.7rem] font-black uppercase tracking-[0.4em] text-slate-500 mb-10 flex items-center gap-4">
                            <span class="px-2 py-0.5 bg-slate-800 rounded border border-white/5 accent-text">05</span> Certs
                        </h2>
                        <div class="grid grid-cols-1 gap-3">
                            ${data.certifications.map(cert => `
                            <div class="text-[0.8rem] font-mono font-bold opacity-50 px-5 py-3 bg-slate-800/30 border border-white/5 rounded-xl hover:opacity-100 hover:accent-border transition-all flex items-center gap-4">
                                <i data-lucide="award" class="w-4 h-4 accent-text"></i> ${cert}
                            </div>
                            `).join('')}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    </div>

    <script>
        const colors = [
            { name: 'Blue', value: '59, 130, 246', hex: '#3b82f6' },
            { name: 'Emerald', value: '16, 185, 129', hex: '#10b981' },
            { name: 'Violet', value: '139, 92, 246', hex: '#8b5cf6' },
            { name: 'Amber', value: '245, 158, 11', hex: '#f5a623' },
            { name: 'Rose', value: '244, 63, 94', hex: '#f43f5e' },
            { name: 'Sky', value: '14, 165, 233', hex: '#0ea5e9' },
            { name: 'Orange', value: '249, 115, 22', hex: '#f97316' },
            { name: 'Teal', value: '20, 184, 166', hex: '#14b8a6' },
            { name: 'Cyan', value: '6, 182, 212', hex: '#06b6d4' },
            { name: 'Fuchsia', value: '217, 70, 239', hex: '#d946ef' }
        ];

        lucide.createIcons();
        function toggleSettings() { document.getElementById('settings-panel').classList.toggle('open'); }
        
        function setTheme(t) { 
            const b = document.getElementById('body-root');
            b.classList.remove('theme-light', 'theme-deep', 'theme-dark');
            b.classList.add('theme-' + t);
            localStorage.setItem('cv-theme', t);
            document.querySelectorAll('.panel-btn').forEach(btn => {
                btn.classList.toggle('active', btn.innerText === t.toUpperCase());
            });
        }

        function setAccent(hex) {
            const color = colors.find(c => c.hex === hex);
            document.documentElement.style.setProperty('--accent', hex);
            document.documentElement.style.setProperty('--accent-rgba', color.value);
            localStorage.setItem('cv-accent', hex);
            
            document.querySelectorAll('.accent-dot').forEach(dot => {
                dot.classList.toggle('active', dot.getAttribute('data-hex') === hex);
            });
        }

        function setFontSize(s) {
            document.getElementById('html-root').style.fontSize = s + 'px';
            localStorage.setItem('cv-font-size', s);
        }

        // Init Accent Picker
        const picker = document.getElementById('accent-picker');
        colors.forEach(c => {
            const btn = document.createElement('button');
            btn.className = 'accent-dot';
            btn.style.backgroundColor = c.hex;
            btn.setAttribute('data-hex', c.hex);
            btn.onclick = () => setAccent(c.hex);
            picker.appendChild(btn);
        });

        const savedTheme = localStorage.getItem('cv-theme') || 'deep';
        const savedAccent = localStorage.getItem('cv-accent') || '#3b82f6';
        const savedFontSize = localStorage.getItem('cv-font-size') || '14';
        
        setTheme(savedTheme);
        setAccent(savedAccent);
        setFontSize(savedFontSize);
        document.querySelector('input[type=range]').value = savedFontSize;

        window.onclick = function(event) {
            const panel = document.getElementById('settings-panel');
            const btn = document.querySelector('.cog-btn');
            if (panel.classList.contains('open') && !panel.contains(event.target) && !btn.contains(event.target)) {
                toggleSettings();
            }
        }
    </script>
</body>
</html>`;
}

// --- GÉNÉRATEUR MARKDOWN ---
function generateMarkdown(lang) {
  const t = i18n[lang];
  const c = data.contact;
  const stripHtml = (html) => html.replace(/<[^>]*>?/gm, '');

  let md = "# " + c.name + "\n";
  md += "**" + c.title[lang] + "**\n\n";
  md += "📍 " + c.location + "  \n";
  md += "📧 [" + c.email + "](mailto:" + c.email + ") | 🌐 [" + c.website + "](https://" + c.website + ")  \n";
  md += "🐙 [GitHub](https://github.com/" + c.github + ") | 🔗 [LinkedIn](https://linkedin.com/in/" + c.linkedin + ")\n\n";
  
  md += "## " + t.profile + "\n" + stripHtml(data.summary[lang]) + "\n\n";
  
  md += "## " + t.experience + "\n\n";
  data.experiences.forEach(exp => {
    md += "### " + exp.role[lang] + " | " + exp.company + "\n*" + exp.period + "*\n";
    exp.details[lang].forEach(d => md += "- " + stripHtml(d) + "\n");
    md += "\n";
  });
  
  md += "## " + t.proSkills + "\n";
  data.skills.professional.forEach(s => {
    md += "- **" + s.category + "**: " + s.tools + "\n";
  });
  md += "\n";
  
  md += "## " + t.certifications + "\n";
  data.certifications.forEach(cert => md += "- " + cert + "\n");
  md += "\n";
  
  return md;
}

// --- MAIN BUILD PROCESS ---
async function build() {
  const browser = await chromium.launch();
  
  for (const lang of ['fr', 'en']) {
    console.log("Génération du CV en " + lang.toUpperCase() + "...");
    
    // 1. HTML
    const htmlContent = generateHTML(lang);
    const htmlPath = path.join(__dirname, "index_" + lang + ".html");
    fs.writeFileSync(htmlPath, htmlContent);
    
    // 2. Markdown
    const mdContent = generateMarkdown(lang);
    const mdFileName = lang === 'fr' ? "CV_FR.md" : "Resume_EN.md";
    fs.writeFileSync(path.join(__dirname, mdFileName), mdContent);
    
    // 3. PDF (via Playwright)
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'networkidle' });
    await page.waitForTimeout(500); 
    
    const pdfFileName = lang === 'fr' 
      ? "CV_Thomas_Bourcey_FR.pdf" 
      : "Resume_Thomas_Bourcey_EN.pdf";

    await page.pdf({
      path: path.join(__dirname, pdfFileName),
      format: 'A4',
      printBackground: true,
      margin: { top: '0px', right: '0px', bottom: '0px', left: '0px' }
    });
    
    await page.close();
  }
  
  await browser.close();
  console.log('Build terminé avec succès !');
}

build().catch(err => {
  console.error('Erreur pendant le build:', err);
  process.exit(1);
});