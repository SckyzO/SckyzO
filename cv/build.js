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
  
  return `<!DOCTYPE html>
<html lang="${lang}" class="dark" id="html-root" style="font-size: 14px;">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${c.name} - ${t.profile} (${lang.toUpperCase()})</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/lucide@latest"></script>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500&display=swap');
        
        :root {
            --accent: #22d3ee;
            --bg-page: #0f172a;
            --bg-card: rgba(30, 41, 59, 0.5);
            --border-card: rgba(71, 85, 105, 0.2);
            --text-main: #e2e8f0;
            --text-muted: #94a3b8;
        }

        .theme-light {
            --bg-page: #f8fafc;
            --bg-card: #ffffff;
            --border-card: #e2e8f0;
            --text-main: #0f172a;
            --text-muted: #64748b;
        }
        .theme-deep {
            --bg-page: #0f172a;
            --bg-card: rgba(30, 41, 59, 0.5);
            --border-card: rgba(71, 85, 105, 0.2);
            --text-main: #e2e8f0;
            --text-muted: #94a3b8;
        }
        .theme-dark {
            --bg-page: #000000;
            --bg-card: #0a0a0a;
            --border-card: #1e293b;
            --text-main: #ffffff;
            --text-muted: #a1a1aa;
        }

        html { transition: font-size 0.1s ease; }

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
            border-radius: 0.75rem;
            backdrop-filter: blur(8px);
        }

        .accent-text { color: var(--accent); }
        .accent-bg { background-color: var(--accent); }
        .accent-border { border-color: var(--accent); }

        /* --- STABLE SETTINGS PANEL (Fixed units) --- */
        #settings-panel { 
            display: none; 
            position: fixed;
            top: 80px;
            right: 24px;
            width: 280px;
            padding: 24px;
            background: rgba(15, 23, 42, 0.95);
            border: 1px solid rgba(71, 85, 105, 0.5);
            border-radius: 12px;
            z-index: 100;
            box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.5);
            backdrop-filter: blur(16px);
        }
        #settings-panel.open { display: block; }
        #settings-panel label { font-size: 10px !important; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; opacity: 0.5; margin-bottom: 12px !important; display: block; text-align: center; color: white !important; }
        
        .panel-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px !important; margin-bottom: 24px !important; }
        .panel-btn { background: rgba(30, 41, 59, 0.5); border: 1px solid rgba(71, 85, 105, 0.3); border-radius: 6px !important; padding: 8px !important; font-size: 10px !important; font-weight: 700; color: white !important; cursor: pointer; transition: all 0.2s; }
        .panel-btn:hover { border-color: var(--accent); }
        .panel-btn.active { border-color: var(--accent); color: var(--accent) !important; }

        .accent-grid { display: flex; justify-content: space-between; padding: 0 8px !important; margin-bottom: 24px !important; }
        .accent-dot { width: 24px !important; height: 24px !important; border-radius: 999px !important; cursor: pointer; transition: transform 0.2s; border: 2px solid transparent !important; }
        .accent-dot:hover { transform: scale(1.2); border-color: white !important; }

        .scaling-ctrl { display: flex; align-items: center; gap: 12px !important; }
        .scaling-ctrl span { font-family: serif; font-style: italic; opacity: 0.4; color: white !important; }

        input[type=range] { -webkit-appearance: none; width: 100%; background: transparent; }
        input[type=range]::-webkit-slider-runnable-track { width: 100%; height: 2px !important; background: #334155; }
        input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; height: 14px !important; width: 14px !important; border-radius: 50% !important; background: var(--accent); cursor: pointer; margin-top: -6px !important; border: 2px solid #0f172a !important; }

        .cog-btn {
            position: fixed; top: 24px; right: 24px; width: 44px !important; height: 44px !important; 
            display: flex; align-items: center; justify-content: center;
            background: rgba(15, 23, 42, 0.8); border: 1px solid rgba(71, 85, 105, 0.3);
            border-radius: 12px !important; color: white !important; cursor: pointer; z-index: 101; transition: all 0.2s;
        }
        .cog-btn:hover { border-color: var(--accent); color: var(--accent) !important; }

        @media print {
            body { background-color: white !important; color: black !important; padding: 0 !important; }
            .no-print { display: none !important; }
            .card { background: white !important; border: 1px solid #e2e8f0 !important; box-shadow: none !important; backdrop-filter: none !important; }
            .accent-text { color: #0891b2 !important; font-weight: bold; }
            .accent-bg { background-color: #334155 !important; }
            .text-slate-400, .text-slate-500 { color: #64748b !important; }
        }
    </style>
</head>
<body class="p-4 md:p-8 lg:p-12 theme-deep" id="body-root">
    
    <button onclick="toggleSettings()" class="cog-btn no-print"><i data-lucide="settings" style="width: 20px; height: 20px;"></i></button>

    <div id="settings-panel" class="no-print">
        <label>Theme</label>
        <div class="panel-grid">
            <button onclick="setTheme('light')" class="panel-btn">LIGHT</button>
            <button onclick="setTheme('deep')" class="panel-btn">DEEP</button>
            <button onclick="setTheme('dark')" class="panel-btn">DARK</button>
        </div>

        <label>Accent Color</label>
        <div class="accent-grid">
            <button onclick="setAccent('#22d3ee')" class="accent-dot bg-cyan-400"></button>
            <button onclick="setAccent('#10b981')" class="accent-dot bg-emerald-500"></button>
            <button onclick="setAccent('#f59e0b')" class="accent-dot bg-amber-500"></button>
            <button onclick="setAccent('#f43f5e')" class="accent-dot bg-rose-500"></button>
            <button onclick="setAccent('#6366f1')" class="accent-dot bg-indigo-500"></button>
        </div>

        <label>Site Scaling</label>
        <div class="scaling-ctrl">
            <span style="font-size: 12px !important;">a</span>
            <input type="range" min="12" max="20" value="14" step="1" oninput="setFontSize(this.value)">
            <span style="font-size: 20px !important;">A</span>
        </div>
    </div>

    <div class="max-w-6xl mx-auto flex flex-col lg:flex-row gap-8">
        
        <!-- SIDEBAR -->
        <aside class="w-full lg:w-[22rem] flex flex-col gap-8 shrink-0">
            <div class="card p-10 text-center lg:text-left flex flex-col items-center lg:items-start">
                <div class="w-24 h-24 bg-slate-700/20 rounded-2xl mb-8 flex items-center justify-center border-2 accent-border relative">
                    <i data-lucide="user" class="w-12 h-12 accent-text"></i>
                </div>
                <h1 class="text-[2rem] font-black tracking-tight mb-2">${c.name}</h1>
                <p class="accent-text font-mono text-[0.8rem] font-bold uppercase tracking-[0.15em] mb-10 text-center lg:text-left leading-tight">${c.title[lang]}</p>
                
                <button onclick="window.print()" class="w-full accent-bg text-slate-950 py-4 rounded-xl text-[0.8rem] font-black tracking-widest transition-all flex items-center justify-center gap-3 mb-8 hover:brightness-110 shadow-xl shadow-cyan-500/10 no-print">
                    <i data-lucide="printer" class="w-5 h-5"></i> GENERATE PDF
                </button>

                <div class="flex gap-4 no-print">
                    <a href="https://github.com/${c.github}" class="p-3.5 card hover:accent-border transition-colors"><i data-lucide="github" class="w-5 h-5"></i></a>
                    <a href="https://linkedin.com/in/${c.linkedin}" class="p-3.5 card hover:accent-border transition-colors"><i data-lucide="linkedin" class="w-5 h-5"></i></a>
                </div>
            </div>

            <div class="card p-10">
                <h2 class="text-[0.7rem] font-black uppercase tracking-[0.25em] text-slate-500 mb-8 flex items-center gap-3">
                    <span class="w-2 h-2 accent-bg rounded-full animate-pulse"></span> ${t.contact}
                </h2>
                <ul class="space-y-6 text-[0.9rem] font-mono">
                    <li class="flex items-center gap-4"><i data-lucide="mail" class="w-4.5 h-4.5 opacity-40 shrink-0"></i><a href="mailto:${c.email}" class="hover:accent-text transition-colors truncate">${c.email}</a></li>
                    <li class="flex items-center gap-4"><i data-lucide="globe" class="w-4.5 h-4.5 opacity-40 shrink-0"></i><a href="https://${c.website}" class="hover:accent-text transition-colors">${c.website}</a></li>
                    <li class="flex items-center gap-4"><i data-lucide="map-pin" class="w-4.5 h-4.5 opacity-40 shrink-0"></i><span class="opacity-80">${c.location}</span></li>
                </ul>
            </div>

            <div class="card p-10">
                <h2 class="text-[0.7rem] font-black uppercase tracking-[0.25em] text-slate-500 mb-8">${t.languages}</h2>
                <div class="space-y-6">
                    ${data.languages[lang].map(l => `
                    <div class="text-[0.9rem]">
                        <div class="flex justify-between mb-3">
                            <span class="font-extrabold uppercase tracking-tight">${l.name}</span>
                            <span class="opacity-40 italic font-mono text-[0.75rem]">${l.level}</span>
                        </div>
                        <div class="w-full bg-slate-700/30 h-1.5 rounded-full overflow-hidden">
                            <div class="accent-bg h-full opacity-80" style="width: ${l.name.includes('rançais') || l.name.includes('rench') ? '100%' : '75%'}"></div>
                        </div>
                    </div>`).join('')}
                </div>
            </div>

            <div class="card p-10">
                <h2 class="text-[0.7rem] font-black uppercase tracking-[0.25em] text-slate-500 mb-8">${t.skills}</h2>
                <div class="flex flex-wrap gap-2.5">
                    ${data.skills.personal[lang].map(s => `<span class="px-3.5 py-2 bg-slate-800/50 text-[0.7rem] font-black rounded-lg border border-slate-700 uppercase tracking-tighter hover:accent-border transition-all cursor-default shadow-sm">${s}</span>`).join('')}
                </div>
            </div>
        </aside>

        <!-- MAIN CONTENT -->
        <main class="flex-grow flex flex-col gap-8">
            <section class="card p-12 relative overflow-hidden group">
                <div class="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                    <i data-lucide="terminal" class="w-32 h-32"></i>
                </div>
                <h2 class="text-[1.5rem] font-black mb-8 flex items-center gap-4 tracking-tight">
                    <i data-lucide="terminal" class="accent-text w-7 h-7"></i> system --info
                </h2>
                <p class="text-slate-400 leading-relaxed text-[1.1rem] max-w-4xl font-medium">${data.summary[lang]}</p>
            </section>

            <section class="grid grid-cols-1 md:grid-cols-2 gap-5">
                ${data.skills.professional.map(s => `
                <div class="card p-8 group hover:accent-border transition-all h-full flex flex-col justify-between">
                    <h3 class="text-[0.7rem] font-black text-slate-500 uppercase tracking-[0.25em] mb-6 flex justify-between items-center">
                        ${s.category}
                        <i data-lucide="cpu" class="w-4 h-4 group-hover:accent-text transition-colors opacity-20"></i>
                    </h3>
                    <p class="font-mono text-[0.95rem] text-slate-300 leading-relaxed">${s.tools}</p>
                </div>`).join('')}
            </section>

            <section class="card p-12">
                <h2 class="text-[1.5rem] font-black mb-12 flex items-center gap-4 tracking-tight">
                    <i data-lucide="activity" class="accent-text w-7 h-7"></i> process --history
                </h2>
                <div class="space-y-16">
                    ${data.experiences.map((exp, idx) => `
                    <div class="relative pl-14 border-l-2 border-slate-800/50 group">
                        <div class="absolute -left-[11px] top-[0.4rem] w-5 h-5 rounded-full ${idx === 0 ? 'accent-bg shadow-[0_0_20px_var(--accent)]' : 'bg-slate-700'} border-[6px] border-[#0f172a] group-hover:scale-125 transition-transform"></div>
                        <div class="flex flex-col md:flex-row md:justify-between md:items-start mb-8 gap-6">
                            <div>
                                <h3 class="text-[1.4rem] font-black text-white mb-2 uppercase tracking-tight">${exp.role[lang]}</h3>
                                <div class="accent-text font-extrabold text-[1rem] flex items-center gap-3 opacity-90 tracking-wide">
                                    <i data-lucide="building-2" class="w-5 h-5"></i> ${exp.company}
                                </div>
                            </div>
                            <span class="font-mono text-[0.75rem] font-black px-5 py-2 bg-slate-800/50 rounded-full border border-white/5 opacity-60 uppercase tracking-widest shrink-0">${exp.period}</span>
                        </div>
                        <ul class="space-y-5">
                            ${exp.details[lang].map(d => `
                            <li class="text-[1rem] text-slate-400 flex items-start gap-5 leading-relaxed group-hover:text-slate-200 transition-colors">
                                <span class="w-2 h-2 accent-bg rounded-full mt-2.5 shrink-0 opacity-20"></span>
                                <span>${d}</span>
                            </li>`).join('')}
                        </ul>
                    </div>`).join('')}
                </div>
            </section>

            <section class="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div class="card p-12">
                    <h2 class="text-[0.85rem] font-black uppercase tracking-[0.2em] text-slate-500 mb-10 flex items-center gap-4">
                        <i data-lucide="graduation-cap" class="w-6 h-6 accent-text opacity-50"></i> academic
                    </h2>
                    <div class="space-y-8">
                        ${data.education.map(ed => `
                        <div class="flex justify-between items-start gap-6">
                            <div>
                                <p class="text-[1.05rem] font-black text-white uppercase tracking-tight">${ed.degree[lang]}</p>
                                <p class="text-[0.85rem] opacity-50 italic font-mono mt-2">${ed.school}</p>
                            </div>
                            <span class="text-[0.9rem] font-bold text-slate-500 shrink-0">${ed.year}</span>
                        </div>`).join('')}
                    </div>
                </div>
                <div class="card p-12">
                    <h2 class="text-[0.85rem] font-black uppercase tracking-[0.2em] text-slate-500 mb-10 flex items-center gap-4">
                        <i data-lucide="award" class="w-6 h-6 accent-text opacity-50"></i> certifications
                    </h2>
                    <div class="flex flex-wrap gap-3">
                        ${data.certifications.map(cert => `
                        <div class="text-[0.8rem] font-mono font-bold opacity-60 px-5 py-2.5 bg-slate-800/50 rounded-lg border border-slate-700/50 hover:opacity-100 hover:accent-border transition-all">
                            <span class="accent-text mr-2">$</span> ${cert}
                        </div>
                        `).join('')}
                    </div>
                </div>
            </section>
        </main>
    </div>

    <script>
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

        function setAccent(c) {
            document.documentElement.style.setProperty('--accent', c);
            localStorage.setItem('cv-accent', c);
            document.querySelectorAll('.accent-bg').forEach(el => {
                if(!el.classList.contains('animate-pulse')) el.style.backgroundColor = c;
            });
        }

        function setFontSize(s) {
            document.getElementById('html-root').style.fontSize = s + 'px';
            localStorage.setItem('cv-font-size', s);
        }

        const savedTheme = localStorage.getItem('cv-theme') || 'deep';
        const savedAccent = localStorage.getItem('cv-accent') || '#22d3ee';
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
  
  let md = "# " + c.name + "\n";
  md += "**" + c.title[lang] + "**\n\n";
  md += "📍 " + c.location + "  \n";
  md += "📧 [" + c.email + "](mailto:" + c.email + ") | 🌐 [" + c.website + "](https://" + c.website + ")  \n";
  md += "🐙 [GitHub](https://github.com/" + c.github + ") | 🔗 [LinkedIn](https://linkedin.com/in/" + c.linkedin + ")\n\n";
  
  md += "## " + t.profile + "\n" + data.summary[lang] + "\n\n";
  
  md += "## " + t.experience + "\n\n";
  data.experiences.forEach(exp => {
    md += "### " + exp.role[lang] + " | " + exp.company + "\n*" + exp.period + "*\n";
    exp.details[lang].forEach(d => md += "- " + d + "\n");
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