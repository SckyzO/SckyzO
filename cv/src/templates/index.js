const fs = require('fs');
const path = require('path');
const { i18n } = require('../i18n');
const { highlightMetrics, getAge, generateRadarChart } = require('../utils');

// Internal helpers.
const flip = (c1, c2, delay='') => `
    <div class="flip-container ${delay}">
        <div class="flip-card">
            <div class="flip-front">${c1}</div>
            <div class="flip-back">${c2}</div>
        </div>
    </div>`;

const stripHtml = (html) => html.replace(/<[^>]*>?/gm, '').replace(/&nbsp;/g, ' ');
const escapeHtml = (value) => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

const getLocalizedValue = (value, lang) => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (value[lang]) return value[lang];
  if (value.en) return value.en;
  if (value.fr) return value.fr;
  return '';
};

const encodeContact = (value) => Buffer.from(String(value), 'utf8')
  .toString('base64')
  .split('')
  .reverse()
  .join('');

// Helper to parse "<strong>Title</strong> : Description".
const parseItem = (htmlString) => {
  const match = htmlString.match(/<strong>(.*?)<\/strong>\s*[:\-]?\s*(.*)/);
  if (match) {
    return { title: match[1], text: match[2] };
  }
  return { title: '', text: htmlString }; 
};

const normalizeHex = (hex) => {
  if (typeof hex !== 'string') return null;
  const trimmed = hex.trim();
  if (!trimmed.startsWith('#')) return null;
  if (trimmed.length === 4) {
    return `#${trimmed[1]}${trimmed[1]}${trimmed[2]}${trimmed[2]}${trimmed[3]}${trimmed[3]}`.toLowerCase();
  }
  if (trimmed.length === 7) {
    return trimmed.toLowerCase();
  }
  return null;
};
const hexToRgb = (hex) => {
  const normalized = normalizeHex(hex);
  if (!normalized) return null;
  const value = normalized.slice(1);
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return null;
  return `${r}, ${g}, ${b}`;
};

const stylesPath = path.join(__dirname, '../styles/main.css');
const baseStyles = fs.readFileSync(stylesPath, 'utf8');

const renderSummaryHtml = (items = []) => `
  <div class="flex flex-col gap-6">
    ${items.map(item => `
      <div>
        <h3 class="font-bold accent-text mb-2 flex items-center gap-2 text-sm uppercase tracking-wide">
          <i data-lucide="${escapeHtml(item.icon)}" class="w-4 h-4"></i> ${escapeHtml(item.title)}
        </h3>
        <p class="leading-relaxed opacity-80">${escapeHtml(item.text)}</p>
      </div>
    `).join('')}
  </div>`;

const summaryToText = (items = []) => items
  .map(item => `${item.title}\n${item.text}`)
  .join('\n\n');

const settingsHintIcons = ['languages', 'palette', 'sun', 'type', 'terminal', 'accessibility'];

// --- HTML GENERATOR ---
function generateHTML(data, lang, activity = null, qrDataURI = '', mode = 'pdf', clientScriptContent = '', options = {}) {
  const isInteractive = mode === 'interactive';
  const lang2 = lang === 'fr' ? 'en' : 'fr';
  const t1 = i18n[lang];
  const t2 = i18n[lang2];
  const c = data.contact;
  const updateDate = new Date().toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US', { day: '2-digit', month: 'short', year: 'numeric' });
  const pdfFilename = lang === 'fr' ? 'CV_Thomas_Bourcey_FR.pdf' : 'Resume_Thomas_Bourcey_EN.pdf';
  const emailEncoded = encodeContact(c.email);
  const phoneEncoded = encodeContact(c.phone);
  const availableThemes = new Set(['light', 'deep', 'dark']);
  const availableFonts = new Set(['hub', 'geist', 'space', 'archivo', 'quantum', 'console', 'architect', 'oxy']);
  const theme = availableThemes.has(options.theme) ? options.theme : 'deep';
  const fontStack = availableFonts.has(options.fontStack) ? options.fontStack : 'architect';
  const defaultAccent = '#3b82f6';
  const defaultAccentRgba = '59, 130, 246';
  const accent = normalizeHex(options.accent) || defaultAccent;
  const accentRgba = typeof options.accentRgba === 'string' ? options.accentRgba : (hexToRgb(accent) || defaultAccentRgba);
  const fontSize = Number.isFinite(options.fontSize) ? Math.max(12, Math.min(20, options.fontSize)) : 15;
  const rootStyle = `font-size: ${fontSize}px; --accent: ${accent}; --accent-rgba: ${accentRgba};`;
  const canonicalUrl = options.canonicalUrl || `https://tomzone.fr/index_${lang}.html`;
  const ogLocale = lang === 'fr' ? 'fr_FR' : 'en_US';
  const ogLocaleAlt = lang === 'fr' ? 'en_US' : 'fr_FR';
  
  const activityHtml = activity ? `<div class="flex items-center justify-end gap-3 text-emerald-500/80 font-bold mb-1"><div class="status-pulse"></div><span class="text-[10px]">LATEST FOCUS: <span class="text-emerald-400 underline decoration-emerald-500/30">${activity.repo}</span></span></div>` : '';
  const proSkillsPrimary = data.skills.professional.slice(0, 4);
  const proSkillsSecondary = data.skills.professional.slice(4);
  const experiencesPage1 = data.experiences.slice(0, 1);
  const experiencesPage2Count = mode === 'pdf' ? 2 : 3;
  const experiencesPage2 = data.experiences.slice(1, 1 + experiencesPage2Count);
  const experiencesPage3 = data.experiences.slice(1 + experiencesPage2Count);

  const normalizeTools = (tools) => {
    if (Array.isArray(tools)) return tools.filter(Boolean);
    if (typeof tools !== 'string') return [];
    return tools.split(',').map((tool) => tool.trim()).filter(Boolean);
  };

  const renderSkillTags = (tools, category, skillId) => {
    const list = normalizeTools(tools);
    const primary = list.slice(0, 3);
    const extra = list.slice(3);
    const primaryHtml = primary.map(tool => `
        <span class="skill-chip skill-tag tool-tag" data-skill="${tool.toLowerCase().trim()}" data-category="${category}">
          ${tool}
        </span>
    `).join('');
    const extraHtml = extra.map(tool => `
        <span class="skill-chip skill-tag tool-tag" data-skill="${tool.toLowerCase().trim()}" data-category="${category}">
          ${tool}
        </span>
    `).join('');
    const moreHtml = extra.length > 0
      ? `<button type="button" class="skill-chip skill-tag-more" data-skill-toggle data-count="${extra.length}" aria-expanded="false" aria-label="Show all tags">+${extra.length}</button>`
      : '';
    const extraBlock = extra.length > 0 ? `<div class="skill-extra">${extraHtml}</div>` : '';
    return `<div class="skill-primary-row">${primaryHtml}${moreHtml}</div>${extraBlock}`;
  };

  const renderProSkillsSection = (skills, delay = '') => flip(`
                <section class="flex flex-col gap-6 no-break text-left reveal" style="animation-delay: 0.2s">
                    <div class="flex items-center gap-4 px-4 text-left"><i data-lucide="cpu" class="w-5 h-5 accent-text"></i><h2 class="section-title" style="font-family: var(--font-sans);">${t1.proSkills}</h2></div>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                      ${skills.map((s, i) => {
                        const skillId = `skill-${lang}-${i}`;
                        const categoryLabel = getLocalizedValue(s.category, lang);
                        const descriptionLabel = getLocalizedValue(s.description, lang);
                        return `<div class="card skill-card p-8 flex flex-col gap-6 group text-left reveal" style="animation-delay: ${0.2 + (i * 0.05)}s" data-category="${categoryLabel}" data-skill-card="${skillId}">
                          <div class="skill-card-header">
                            <div class="skill-icon">
                              <i data-lucide="${s.icon || 'cpu'}" class="w-5 h-5 accent-text"></i>
                            </div>
                            <div class="skill-meta">
                              <div class="skill-title">${categoryLabel}</div>
                              <div class="skill-desc">${descriptionLabel}</div>
                            </div>
                          </div>
                          <div class="skill-chips" data-skill-tags="${skillId}">
                            ${renderSkillTags(s.tools, categoryLabel, skillId)}
                          </div>
                        </div>`;
                      }).join('')}
                    </div>
                </section>`,
                `<section class="flex flex-col gap-6 no-break text-left">
                    <div class="flex items-center gap-4 px-4 text-left"><i data-lucide="cpu" class="w-5 h-5 accent-text"></i><h2 class="section-title" style="font-family: var(--font-sans);">${t2.proSkills}</h2></div>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                      ${skills.map((s, i) => {
                        const skillId = `skill-${lang2}-${i}`;
                        const categoryLabel = getLocalizedValue(s.category, lang2);
                        const descriptionLabel = getLocalizedValue(s.description, lang2);
                        return `<div class="card skill-card p-8 flex flex-col gap-6 group text-left" data-category="${categoryLabel}" data-skill-card="${skillId}">
                          <div class="skill-card-header">
                            <div class="skill-icon">
                              <i data-lucide="${s.icon || 'cpu'}" class="w-5 h-5 accent-text"></i>
                            </div>
                            <div class="skill-meta">
                              <div class="skill-title">${categoryLabel}</div>
                              <div class="skill-desc">${descriptionLabel}</div>
                            </div>
                          </div>
                          <div class="skill-chips" data-skill-tags="${skillId}">
                            ${renderSkillTags(s.tools, categoryLabel, skillId)}
                          </div>
                        </div>`;
                      }).join('')}
                    </div>
                </section>`, delay);

  const renderExperienceSection = (experiences, delay = '') => flip(`
                <section class="flex flex-col gap-6 no-break text-left reveal" style="animation-delay: 0.4s">
                    <div class="flex items-center gap-4 px-4 text-left"><i data-lucide="activity" class="w-5 h-5 accent-text"></i><h2 class="section-title" style="font-family: var(--font-sans);">${t1.experience}</h2></div>
                    <div class="flex flex-col gap-6">
                        ${experiences.map((exp, idx) => {
                            return `<div class="card p-10 relative overflow-hidden group text-left break-inside-avoid page-break-inside-avoid mb-6">` + 
                            `<div class="flex flex-col md:flex-row md:justify-between md:items-start mb-6 gap-6 text-left"><div><h3 class="text-[1.6rem] font-black text-[var(--text-main)] mb-2 tracking-tight leading-none text-left">${exp.role[lang]}</h3><div class="accent-text font-extrabold text-[1.1rem] flex items-center gap-3 opacity-90 tracking-wide uppercase text-left"><i data-lucide="building-2" class="w-5 h-5 opacity-50"></i> ${exp.company}</div></div><span class="font-mono text-[0.75rem] font-black px-5 py-2 bg-slate-800/50 rounded-xl border border-white/5 opacity-60 group-hover:opacity-100 group-hover:border-accent/30 group-hover:shadow-[0_0_15px_rgba(var(--accent-rgba),0.2)] transition-all duration-300 uppercase tracking-widest shrink-0">${exp.period}</span></div>` +
                            `<p class="text-sm opacity-60 italic mb-8 border-l-2 border-accent/20 pl-4 py-1">${exp.summary[lang]}</p>` +
                            `<div class="space-y-6">` +
                            exp.domains.map(dom => {
                                const domTitle = getLocalizedValue(dom.title, lang);
                                return `
                                <div>
                                    <h4 class="font-bold text-sm text-[var(--text-main)] mb-3 flex items-center gap-3"><span class="w-1.5 h-1.5 accent-bg rounded-full opacity-50 group-hover:opacity-100 group-hover:shadow-[0_0_10px_var(--accent)] transition-all"></span>${domTitle}</h4>
                                    <ul class="space-y-1 pl-2 border-l border-[var(--border-card)] group-hover:border-accent/30 ml-1 transition-colors duration-500">
                                        ${dom.items[lang].map(item => {
                                            const { title, text } = parseItem(item);
                                            return `<li class="relative pl-6 pr-2 py-1.5 rounded-lg text-[0.95rem] opacity-70 hover:opacity-100 hover:bg-accent/5 leading-relaxed group/item text-left transition-all duration-200">
                                                <span class="absolute left-0 top-[0.9rem] w-2 h-[1px] bg-accent/40 group-hover/item:w-4 group-hover/item:bg-accent group-hover:bg-accent transition-all"></span>
                                                ${title ? `<span class="font-bold text-[var(--text-main)] opacity-90">${title} :</span>` : ''}
                                                <span class="text-left">${highlightMetrics(text)}</span>
                                            </li>`;
                                        }).join('')}
                                    </ul>
                                </div>
                            `;
                            }).join('') +
                            `</div></div>`}).join('')}</div>
                </section>`,
                `<section class="flex flex-col gap-6 no-break text-left">
                    <div class="flex items-center gap-4 px-4 text-left"><i data-lucide="activity" class="w-5 h-5 accent-text"></i><h2 class="section-title" style="font-family: var(--font-sans);">${t2.experience}</h2></div>
                    <div class="card p-12 space-y-12 text-left relative overflow-hidden">
                        ${experiences.map((exp, idx) => {
                            return `<div class="exp-card relative pl-10 border-l-2 timeline-border transition-colors duration-300 group text-left">` +
                            `<div class="absolute -left-[11px] top-[0.4rem] w-5 h-5 rounded-full ${idx === 0 ? 'accent-bg shadow-[0_0_20px_var(--accent)]' : 'bg-slate-700'} border-[6px] border-[var(--bg-card)] transition-all duration-300 group-hover:scale-125 group-hover:bg-[var(--accent)] group-hover:shadow-[0_0_25px_var(--accent)] z-20"></div>` +
                            `<div class="flex flex-col md:flex-row md:justify-between md:items-start mb-6 gap-6 text-left"><div><h3 class="text-[1.6rem] font-black text-[var(--text-main)] mb-2 tracking-tight leading-none text-left">${exp.role[lang2]}</h3><div class="accent-text font-extrabold text-[1.1rem] flex items-center gap-3 opacity-90 tracking-wide uppercase text-left"><i data-lucide="building-2" class="w-5 h-5 opacity-50"></i> ${exp.company}</div></div><span class="font-mono text-[0.75rem] font-black px-5 py-2 bg-slate-800/50 rounded-xl border border-white/5 opacity-60 group-hover:opacity-100 group-hover:border-accent/30 group-hover:shadow-[0_0_15px_rgba(var(--accent-rgba),0.2)] transition-all duration-300 uppercase tracking-widest shrink-0">${exp.period}</span></div>` +
                            `<p class="text-sm opacity-60 italic mb-8 border-l-2 border-accent/20 pl-4 py-1">${exp.summary[lang2]}</p>` +
                            `<div class="space-y-6">` +
                            exp.domains.map(dom => {
                                const domTitle = getLocalizedValue(dom.title, lang2);
                                return `
                                <div>
                                    <h4 class="font-bold text-sm text-[var(--text-main)] mb-3 flex items-center gap-3"><span class="w-1.5 h-1.5 accent-bg rounded-full opacity-50 group-hover:opacity-100 group-hover:shadow-[0_0_10px_var(--accent)] transition-all"></span>${domTitle}</h4>
                                    <ul class="space-y-1 pl-2 border-l border-[var(--border-card)] group-hover:border-accent/30 ml-1 transition-colors duration-500">
                                        ${dom.items[lang2].map(item => {
                                            const { title, text } = parseItem(item);
                                            return `<li class="relative pl-6 pr-2 py-1.5 rounded-lg text-[0.95rem] opacity-70 hover:opacity-100 hover:bg-accent/5 leading-relaxed group/item text-left transition-all duration-200">
                                                <span class="absolute left-0 top-[0.9rem] w-2 h-[1px] bg-accent/40 group-hover/item:w-4 group-hover/item:bg-accent group-hover:bg-accent transition-all"></span>
                                                ${title ? `<span class="font-bold text-[var(--text-main)] opacity-90">${title} :</span>` : ''}
                                                <span class="text-left">${highlightMetrics(text)}</span>
                                            </li>`;
                                        }).join('')}
                                    </ul>
                                </div>
                            `;
                            }).join('') +
                            `</div></div>`}).join('')}</div>
                </section>`, delay);

  const contactSection = flip(`
                <section class="flex flex-col gap-6 no-break reveal text-left no-break" style="animation-delay: 0.1s">
                    <div class="flex items-center gap-4 px-4 text-left"><i data-lucide="mail" class="w-5 h-5 accent-text"></i><h2 class="section-title" style="font-family: var(--font-sans);">${t1.contact}</h2></div>
                    <div class="card p-8 flex flex-col gap-6 !overflow-visible">
                        <div class="flex flex-col gap-2">
                            ${isInteractive ? `
                            <div class="contact-secure" data-contact-type="email" data-contact-encoded="${emailEncoded}" data-label-reveal="${t1.contactReveal}" data-label-copy="${t1.contactCopy}" data-label-copied="${t1.contactCopied}">
                                <a href="#" class="flex items-center gap-4 p-2 rounded-xl hover:bg-white/5 border border-transparent hover:border-accent/30 transition-all group has-tooltip contact-link">
                                    <div class="w-10 h-10 rounded-xl surface-muted flex items-center justify-center text-[var(--text-main)] group-hover:text-accent group-hover:bg-accent/10 transition-colors"><i data-lucide="mail" class="w-4 h-4"></i></div>
                                    <div class="flex flex-col overflow-hidden">
                                        <span class="font-bold text-sm text-[var(--text-main)] group-hover:accent-text transition-colors contact-value">${t1.contactHidden}</span>
                                        <span class="text-[10px] uppercase tracking-wider opacity-40">Email</span>
                                    </div>
                                    <span class="tooltip-content">${t1.emailTooltip}</span>
                                </a>
                                <div class="contact-actions">
                                    <button type="button" class="contact-action contact-action--icon" data-contact-action="reveal" aria-label="${t1.contactReveal}" title="${t1.contactReveal}">
                                        <i data-lucide="eye" class="w-4 h-4"></i>
                                    </button>
                                    <button type="button" class="contact-action contact-action--icon" data-contact-action="copy" aria-label="${t1.contactCopy}" title="${t1.contactCopy}" disabled>
                                        <i data-lucide="copy" class="w-4 h-4"></i>
                                    </button>
                                </div>
                            </div>
                            ` : `
                            <a href="mailto:${c.email}" class="flex items-center gap-4 p-2 rounded-xl hover:bg-white/5 border border-transparent hover:border-accent/30 transition-all group has-tooltip">
                                <div class="w-10 h-10 rounded-xl surface-muted flex items-center justify-center text-[var(--text-main)] group-hover:text-accent group-hover:bg-accent/10 transition-colors"><i data-lucide="mail" class="w-4 h-4"></i></div>
                                <div class="flex flex-col overflow-hidden">
                                    <span class="font-bold text-sm text-[var(--text-main)] group-hover:accent-text transition-colors">${c.email}</span>
                                    <span class="text-[10px] uppercase tracking-wider opacity-40">Email</span>
                                </div>
                                <span class="tooltip-content">${t1.emailTooltip}</span>
                            </a>
                            `}
                            ${isInteractive ? `
                            <div class="contact-secure" data-contact-type="phone" data-contact-encoded="${phoneEncoded}" data-label-reveal="${t1.contactReveal}" data-label-copy="${t1.contactCopy}" data-label-copied="${t1.contactCopied}">
                                <a href="#" class="flex items-center gap-4 p-2 rounded-xl hover:bg-white/5 border border-transparent hover:border-accent/30 transition-all group has-tooltip contact-link">
                                    <div class="w-10 h-10 rounded-xl surface-muted flex items-center justify-center text-[var(--text-main)] group-hover:text-accent group-hover:bg-accent/10 transition-colors"><i data-lucide="phone" class="w-4 h-4"></i></div>
                                    <div class="flex flex-col overflow-hidden">
                                        <span class="font-bold text-sm text-[var(--text-main)] group-hover:accent-text transition-colors contact-value">${t1.contactHidden}</span>
                                        <span class="text-[10px] uppercase tracking-wider opacity-40">Phone</span>
                                    </div>
                                    <span class="tooltip-content">${t1.phoneTooltip}</span>
                                </a>
                                <div class="contact-actions">
                                    <button type="button" class="contact-action contact-action--icon" data-contact-action="reveal" aria-label="${t1.contactReveal}" title="${t1.contactReveal}">
                                        <i data-lucide="eye" class="w-4 h-4"></i>
                                    </button>
                                    <button type="button" class="contact-action contact-action--icon" data-contact-action="copy" aria-label="${t1.contactCopy}" title="${t1.contactCopy}" disabled>
                                        <i data-lucide="copy" class="w-4 h-4"></i>
                                    </button>
                                </div>
                            </div>
                            ` : `
                            <a href="tel:${c.phone.replace(/\\s/g, '')}" class="flex items-center gap-4 p-2 rounded-xl hover:bg-white/5 border border-transparent hover:border-accent/30 transition-all group has-tooltip">
                                <div class="w-10 h-10 rounded-xl surface-muted flex items-center justify-center text-[var(--text-main)] group-hover:text-accent group-hover:bg-accent/10 transition-colors"><i data-lucide="phone" class="w-4 h-4"></i></div>
                                <div class="flex flex-col overflow-hidden">
                                    <span class="font-bold text-sm text-[var(--text-main)] group-hover:accent-text transition-colors">${c.phone}</span>
                                    <span class="text-[10px] uppercase tracking-wider opacity-40">Phone</span>
                                </div>
                                <span class="tooltip-content">${t1.phoneTooltip}</span>
                            </a>
                            `}
                            <a href="https://${c.website}" target="_blank" class="flex items-center gap-4 p-2 rounded-xl hover:bg-white/5 border border-transparent hover:border-accent/30 transition-all group has-tooltip">
                                <div class="w-10 h-10 rounded-xl surface-muted flex items-center justify-center text-[var(--text-main)] group-hover:text-accent group-hover:bg-accent/10 transition-colors"><i data-lucide="globe" class="w-4 h-4"></i></div>
                                <div class="flex flex-col overflow-hidden">
                                    <span class="font-bold text-sm text-[var(--text-main)] group-hover:accent-text transition-colors">${c.website}</span>
                                    <span class="text-[10px] uppercase tracking-wider opacity-40">Portfolio</span>
                                </div>
                                <span class="tooltip-content">${t1.websiteTooltip}</span>
                            </a>
                            <div class="flex items-center gap-4 p-2 rounded-xl hover:bg-white/5 border border-transparent hover:border-accent/30 transition-all group">
                                <div class="w-10 h-10 rounded-xl surface-muted flex items-center justify-center text-[var(--text-main)] group-hover:text-accent group-hover:bg-accent/10 transition-colors"><i data-lucide="calendar" class="w-4 h-4"></i></div>
                                <div class="flex flex-col">
                                    <span class="font-bold text-sm text-[var(--text-main)] group-hover:accent-text transition-colors">${getAge(c.birthDate)} ans <span class="opacity-50 font-normal text-xs">(${new Date(c.birthDate).toLocaleDateString('fr-FR')})</span></span>
                                    <span class="text-[10px] uppercase tracking-wider opacity-40">Age</span>
                                </div>
                            </div>
                            <div class="flex items-center gap-4 p-2 rounded-xl hover:bg-white/5 border border-transparent hover:border-accent/30 transition-all group">
                                <div class="w-10 h-10 rounded-xl surface-muted flex items-center justify-center text-[var(--text-main)] group-hover:text-accent group-hover:bg-accent/10 transition-colors"><i data-lucide="map-pin" class="w-4 h-4"></i></div>
                                <div class="flex flex-col">
                                    <div class="flex items-center gap-2">
                                        <span class="font-bold text-sm text-[var(--text-main)] group-hover:accent-text transition-colors">Toulouse, FR</span>
                                        <span class="w-1 h-1 bg-white/20 rounded-full"></span>
                                        <span class="font-mono text-xs accent-text no-print" id="local-time-fr">--:--</span>
                                    </div>
                                    <span class="text-[10px] uppercase tracking-wider opacity-40">Location</span>
                                </div>
                            </div>
                        </div>
                        <div class="h-px bg-[var(--border-card)] w-full my-2"></div>
                        <div class="grid grid-cols-2 gap-3">
                            <a href="https://github.com/${c.github}" target="_blank" class="flex items-center justify-center gap-2 py-3 rounded-xl border border-[var(--border-card)] hover:border-accent/50 hover:bg-accent/5 transition-all text-xs font-bold uppercase tracking-wide group has-tooltip"><i data-lucide="github" class="w-4 h-4 group-hover:accent-text"></i> GitHub<span class="tooltip-content">${t1.openGithub}</span></a>
                            <a href="https://linkedin.com/in/${c.linkedin}" target="_blank" class="flex items-center justify-center gap-2 py-3 rounded-xl border border-[var(--border-card)] hover:border-accent/50 hover:bg-accent/5 transition-all text-xs font-bold uppercase tracking-wide group has-tooltip"><i data-lucide="linkedin" class="w-4 h-4 group-hover:accent-text"></i> LinkedIn<span class="tooltip-content">${t1.openLinkedIn}</span></a>
                        </div>
                    </div>
                </section>`,
                `<section class="flex flex-col gap-6 no-break text-left">
                    <div class="flex items-center gap-4 px-4 text-left"><i data-lucide="mail" class="w-5 h-5 accent-text"></i><h2 class="section-title" style="font-family: var(--font-sans);">${t2.contact}</h2></div>
                    <div class="card p-8 flex flex-col gap-6 !overflow-visible">
                        <div class="flex flex-col gap-2">
                            ${isInteractive ? `
                            <div class="contact-secure" data-contact-type="email" data-contact-encoded="${emailEncoded}" data-label-reveal="${t2.contactReveal}" data-label-copy="${t2.contactCopy}" data-label-copied="${t2.contactCopied}">
                                <a href="#" class="flex items-center gap-4 p-2 rounded-xl hover:bg-white/5 border border-transparent hover:border-accent/30 transition-all group has-tooltip contact-link">
                                    <div class="w-10 h-10 rounded-xl surface-muted flex items-center justify-center text-[var(--text-main)] group-hover:text-accent group-hover:bg-accent/10 transition-colors"><i data-lucide="mail" class="w-4 h-4"></i></div>
                                    <div class="flex flex-col overflow-hidden">
                                        <span class="font-bold text-sm text-[var(--text-main)] group-hover:accent-text transition-colors contact-value">${t2.contactHidden}</span>
                                        <span class="text-[10px] uppercase tracking-wider opacity-40">Email</span>
                                    </div>
                                    <span class="tooltip-content">${t2.emailTooltip}</span>
                                </a>
                                <div class="contact-actions">
                                    <button type="button" class="contact-action contact-action--icon" data-contact-action="reveal" aria-label="${t2.contactReveal}" title="${t2.contactReveal}">
                                        <i data-lucide="eye" class="w-4 h-4"></i>
                                    </button>
                                    <button type="button" class="contact-action contact-action--icon" data-contact-action="copy" aria-label="${t2.contactCopy}" title="${t2.contactCopy}" disabled>
                                        <i data-lucide="copy" class="w-4 h-4"></i>
                                    </button>
                                </div>
                            </div>
                            ` : `
                            <a href="mailto:${c.email}" class="flex items-center gap-4 p-2 rounded-xl hover:bg-white/5 border border-transparent hover:border-accent/30 transition-all group has-tooltip">
                                <div class="w-10 h-10 rounded-xl surface-muted flex items-center justify-center text-[var(--text-main)] group-hover:text-accent group-hover:bg-accent/10 transition-colors"><i data-lucide="mail" class="w-4 h-4"></i></div>
                                <div class="flex flex-col overflow-hidden">
                                    <span class="font-bold text-sm text-[var(--text-main)] group-hover:accent-text transition-colors">${c.email}</span>
                                    <span class="text-[10px] uppercase tracking-wider opacity-40">Email</span>
                                </div>
                                <span class="tooltip-content">${t2.emailTooltip}</span>
                            </a>
                            `}
                            ${isInteractive ? `
                            <div class="contact-secure" data-contact-type="phone" data-contact-encoded="${phoneEncoded}" data-label-reveal="${t2.contactReveal}" data-label-copy="${t2.contactCopy}" data-label-copied="${t2.contactCopied}">
                                <a href="#" class="flex items-center gap-4 p-2 rounded-xl hover:bg-white/5 border border-transparent hover:border-accent/30 transition-all group has-tooltip contact-link">
                                    <div class="w-10 h-10 rounded-xl surface-muted flex items-center justify-center text-[var(--text-main)] group-hover:text-accent group-hover:bg-accent/10 transition-colors"><i data-lucide="phone" class="w-4 h-4"></i></div>
                                    <div class="flex flex-col overflow-hidden">
                                        <span class="font-bold text-sm text-[var(--text-main)] group-hover:accent-text transition-colors contact-value">${t2.contactHidden}</span>
                                        <span class="text-[10px] uppercase tracking-wider opacity-40">Phone</span>
                                    </div>
                                    <span class="tooltip-content">${t2.phoneTooltip}</span>
                                </a>
                                <div class="contact-actions">
                                    <button type="button" class="contact-action contact-action--icon" data-contact-action="reveal" aria-label="${t2.contactReveal}" title="${t2.contactReveal}">
                                        <i data-lucide="eye" class="w-4 h-4"></i>
                                    </button>
                                    <button type="button" class="contact-action contact-action--icon" data-contact-action="copy" aria-label="${t2.contactCopy}" title="${t2.contactCopy}" disabled>
                                        <i data-lucide="copy" class="w-4 h-4"></i>
                                    </button>
                                </div>
                            </div>
                            ` : `
                            <a href="tel:${c.phone.replace(/\\s/g, '')}" class="flex items-center gap-4 p-2 rounded-xl hover:bg-white/5 border border-transparent hover:border-accent/30 transition-all group has-tooltip">
                                <div class="w-10 h-10 rounded-xl surface-muted flex items-center justify-center text-[var(--text-main)] group-hover:text-accent group-hover:bg-accent/10 transition-colors"><i data-lucide="phone" class="w-4 h-4"></i></div>
                                <div class="flex flex-col overflow-hidden">
                                    <span class="font-bold text-sm text-[var(--text-main)] group-hover:accent-text transition-colors">${c.phone}</span>
                                    <span class="text-[10px] uppercase tracking-wider opacity-40">Phone</span>
                                </div>
                                <span class="tooltip-content">${t2.phoneTooltip}</span>
                            </a>
                            `}
                            <a href="https://${c.website}" target="_blank" class="flex items-center gap-4 p-2 rounded-xl hover:bg-white/5 border border-transparent hover:border-accent/30 transition-all group has-tooltip">
                                <div class="w-10 h-10 rounded-xl surface-muted flex items-center justify-center text-[var(--text-main)] group-hover:text-accent group-hover:bg-accent/10 transition-colors"><i data-lucide="globe" class="w-4 h-4"></i></div>
                                <div class="flex flex-col overflow-hidden">
                                    <span class="font-bold text-sm text-[var(--text-main)] group-hover:accent-text transition-colors">${c.website}</span>
                                    <span class="text-[10px] uppercase tracking-wider opacity-40">Portfolio</span>
                                </div>
                                <span class="tooltip-content">${t2.websiteTooltip}</span>
                            </a>
                            <div class="flex items-center gap-4 p-2 rounded-xl hover:bg-white/5 border border-transparent hover:border-accent/30 transition-all group">
                                <div class="w-10 h-10 rounded-xl surface-muted flex items-center justify-center text-[var(--text-main)] group-hover:text-accent group-hover:bg-accent/10 transition-colors"><i data-lucide="calendar" class="w-4 h-4"></i></div>
                                <div class="flex flex-col">
                                    <span class="font-bold text-sm text-[var(--text-main)] group-hover:accent-text transition-colors">${getAge(c.birthDate)} years old <span class="opacity-50 font-normal text-xs">(${new Date(c.birthDate).toLocaleDateString('en-US')})</span></span>
                                    <span class="text-[10px] uppercase tracking-wider opacity-40">Age</span>
                                </div>
                            </div>
                            <div class="flex items-center gap-4 p-2 rounded-xl hover:bg-white/5 border border-transparent hover:border-accent/30 transition-all group">
                                <div class="w-10 h-10 rounded-xl surface-muted flex items-center justify-center text-[var(--text-main)] group-hover:text-accent group-hover:bg-accent/10 transition-colors"><i data-lucide="map-pin" class="w-4 h-4"></i></div>
                                <div class="flex flex-col">
                                    <div class="flex items-center gap-2">
                                        <span class="font-bold text-sm text-[var(--text-main)] group-hover:accent-text transition-colors">Toulouse, FR</span>
                                        <span class="w-1 h-1 bg-white/20 rounded-full"></span>
                                        <span class="font-mono text-xs accent-text no-print" id="local-time-en">--:--</span>
                                    </div>
                                    <span class="text-[10px] uppercase tracking-wider opacity-40">Location</span>
                                </div>
                            </div>
                        </div>
                        <div class="h-px bg-[var(--border-card)] w-full my-2"></div>
                        <div class="grid grid-cols-2 gap-3">
                            <a href="https://github.com/${c.github}" target="_blank" class="flex items-center justify-center gap-2 py-3 rounded-xl border border-[var(--border-card)] hover:border-accent/50 hover:bg-accent/5 transition-all text-xs font-bold uppercase tracking-wide group has-tooltip"><i data-lucide="github" class="w-4 h-4 group-hover:accent-text"></i> GitHub<span class="tooltip-content">${t2.openGithub}</span></a>
                            <a href="https://linkedin.com/in/${c.linkedin}" target="_blank" class="flex items-center justify-center gap-2 py-3 rounded-xl border border-[var(--border-card)] hover:border-accent/50 hover:bg-accent/5 transition-all text-xs font-bold uppercase tracking-wide group has-tooltip"><i data-lucide="linkedin" class="w-4 h-4 group-hover:accent-text"></i> LinkedIn<span class="tooltip-content">${t2.openLinkedIn}</span></a>
                        </div>
                    </div>
                </section>`, 'delay-100');

  const expertiseOverviewSection = isInteractive ? flip(`
                <section class="flex flex-col gap-6 no-break reveal text-left" style="animation-delay: 0.2s">
                    <div class="flex items-center gap-4 px-4 text-left"><i data-lucide="bar-chart-3" class="w-5 h-5 accent-text"></i><h2 class="section-title" style="font-family: var(--font-sans);">${t1.expertiseOverview}</h2></div>
                    <div class="card p-4 flex items-center justify-center h-64">
                        ${generateRadarChart(data.skills.professional, lang)}
                    </div>
                </section>`,
                `<section class="flex flex-col gap-6 no-break text-left">
                    <div class="flex items-center gap-4 px-4 text-left"><i data-lucide="bar-chart-3" class="w-5 h-5 accent-text"></i><h2 class="section-title" style="font-family: var(--font-sans);">${t2.expertiseOverview}</h2></div>
                    <div class="card p-4 flex items-center justify-center h-64">
                        ${generateRadarChart(data.skills.professional, lang2)}
                    </div>
                </section>`, 'delay-200') : '';

  const languagesSection = flip(`
                <section class="flex flex-col gap-6 no-break reveal text-left" style="animation-delay: 0.3s">
                    <div class="flex items-center gap-4 px-4 text-left"><i data-lucide="globe" class="w-5 h-5 accent-text"></i><h2 class="section-title" style="font-family: var(--font-sans);">${t1.languages}</h2></div>
                    <div class="card p-8 text-left space-y-8 text-left">${data.languages[lang].map(l => `<div class="text-left"><div class="flex justify-between mb-3 font-bold text-sm text-left"><span>${l.name}</span><span class="accent-text opacity-50 italic font-mono text-[0.7rem]">${l.level}</span></div><div class="w-full surface-muted h-1.5 rounded-full overflow-hidden"><div class="accent-bg h-full opacity-80 shadow-[0_0_8px_var(--accent)]" style="width: ${l.name.includes('rançais') || l.name.includes('rench') ? '100%' : '75%'}"></div></div></div>`).join('')}</div>
                </section>`,
                `<section class="flex flex-col gap-6 no-break text-left">
                    <div class="flex items-center gap-4 px-4 text-left"><i data-lucide="globe" class="w-5 h-5 accent-text"></i><h2 class="section-title" style="font-family: var(--font-sans);">${t2.languages}</h2></div>
                    <div class="card p-8 text-left space-y-8 text-left">${data.languages[lang2].map(l => `<div class="text-left"><div class="flex justify-between mb-3 font-bold text-sm text-left"><span>${l.name}</span><span class="accent-text opacity-50 italic font-mono text-[0.7rem]">${l.level}</span></div><div class="w-full surface-muted h-1.5 rounded-full overflow-hidden"><div class="accent-bg h-full opacity-80 shadow-[0_0_8px_var(--accent)]" style="width: ${l.name.includes('rançais') || l.name.includes('rench') ? '100%' : '75%'}"></div></div></div>`).join('')}</div>
                </section>`, 'delay-300');

  const personalSkillsSection = flip(`
                <section class="flex flex-col gap-6 no-break reveal text-left" style="animation-delay: 0.4s">
                    <div class="flex items-center gap-4 px-4"><i data-lucide="award" class="w-5 h-5 accent-text"></i><h2 class="section-title" style="font-family: var(--font-sans);">${t1.skills}</h2></div>
                    <div class="card p-8 flex flex-wrap gap-2.5 text-left !overflow-visible">
                        ${data.skills.personal[lang].map(s => `
                            <span class="has-tooltip px-4 py-2 border border-[var(--border-card)] rounded-full text-[0.7rem] font-bold uppercase tracking-wider text-[var(--text-muted)] hover:text-[var(--text-main)] hover:border-accent/50 transition-all cursor-default flex items-center gap-2.5 group">
                                <i data-lucide="${s.icon}" class="w-3.5 h-3.5 accent-text opacity-70 group-hover:opacity-100 transition-opacity"></i>
                                ${s.label}
                                <span class="tooltip-content">${s.desc}</span>
                            </span>
                        `).join('')}
                    </div>
                </section>`,
                `<section class="flex flex-col gap-6 no-break text-left">
                    <div class="flex items-center gap-4 px-4"><i data-lucide="award" class="w-5 h-5 accent-text"></i><h2 class="section-title" style="font-family: var(--font-sans);">${t2.skills}</h2></div>
                    <div class="card p-8 flex flex-wrap gap-2.5 text-left !overflow-visible">
                        ${data.skills.personal[lang2].map(s => `
                            <span class="has-tooltip px-4 py-2 border border-[var(--border-card)] rounded-full text-[0.7rem] font-bold uppercase tracking-wider text-[var(--text-muted)] hover:text-[var(--text-main)] hover:border-accent/50 transition-all cursor-default flex items-center gap-2.5 group">
                                <i data-lucide="${s.icon}" class="w-3.5 h-3.5 accent-text opacity-70 group-hover:opacity-100 transition-opacity"></i>
                                ${s.label}
                                <span class="tooltip-content">${s.desc}</span>
                            </span>
                        `).join('')}
                    </div>
                </section>`, 'delay-400');

  const educationSection = flip(`
                <section class="flex flex-col gap-6 no-break reveal text-left" style="animation-delay: 0.5s">
                    <div class="flex items-center gap-4 px-4 text-left"><i data-lucide="graduation-cap" class="w-5 h-5 accent-text"></i><h2 class="section-title" style="font-family: var(--font-sans);">${t1.education}</h2></div>
                    <div class="card p-8 text-left space-y-8 text-left">${data.education.map(ed => `<div class="flex justify-between items-start gap-4 text-left"><div class="text-left"><p class="text-[0.9rem] font-black text-[var(--text-main)] uppercase tracking-tight leading-tight mb-1 text-left">${ed.degree[lang]}</p><p class="text-[0.8rem] opacity-40 italic font-mono text-left">${ed.school}</p></div><span class="text-[0.8rem] font-bold text-slate-500 shrink-0 text-left">${ed.year}</span></div>`).join('')}</div>
                </section>`,
                `<section class="flex flex-col gap-6 no-break text-left">
                    <div class="flex items-center gap-4 px-4 text-left"><i data-lucide="graduation-cap" class="w-5 h-5 accent-text"></i><h2 class="section-title" style="font-family: var(--font-sans);">${t2.education}</h2></div>
                    <div class="card p-8 text-left space-y-8 text-left">${data.education.map(ed => `<div class="flex justify-between items-start gap-4 text-left"><div class="text-left"><p class="text-[0.9rem] font-black text-[var(--text-main)] uppercase tracking-tight leading-tight mb-1 text-left">${ed.degree[lang2]}</p><p class="text-[0.8rem] opacity-40 italic font-mono text-left">${ed.school}</p></div><span class="text-[0.8rem] font-bold text-slate-500 shrink-0 text-left">${ed.year}</span></div>`).join('')}</div>
                </section>`, 'delay-500');

  const certificationsSection = flip(`
                <section class="flex flex-col gap-6 no-break reveal text-left" style="animation-delay: 0.6s">
                    <div class="flex items-center gap-4 px-4 text-left"><i data-lucide="award" class="w-5 h-5 accent-text"></i><h2 class="section-title" style="font-family: var(--font-sans);">${t1.certifications}</h2></div>
                    <div class="card p-6 text-left flex flex-col gap-4">
                        ${data.certifications.map(cert => `
                            <div class="flex items-center gap-4 group">
                                <div class="w-9 h-9 rounded-xl surface-muted flex items-center justify-center shrink-0 group-hover:accent-border border border-transparent transition-all">
                                    <i data-lucide="${cert.icon}" class="w-4.5 h-4.5 accent-text opacity-80"></i>
                                </div>
                                <div class="flex flex-col min-w-0">
                                    <span class="text-[0.8rem] font-black uppercase tracking-tight text-[var(--text-main)] truncate">${cert.name}</span>
                                    <span class="text-[0.65rem] opacity-40 uppercase tracking-widest truncate">${cert.issuer} • ${cert.year}</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </section>`,
                `<section class="flex flex-col gap-6 no-break text-left">
                    <div class="flex items-center gap-4 px-4 text-left"><i data-lucide="award" class="w-5 h-5 accent-text"></i><h2 class="section-title" style="font-family: var(--font-sans);">${t2.certifications}</h2></div>
                    <div class="card p-6 text-left flex flex-col gap-4">
                        ${data.certifications.map(cert => `
                            <div class="flex items-center gap-4 group">
                                <div class="w-9 h-9 rounded-xl surface-muted flex items-center justify-center shrink-0 group-hover:accent-border border border-transparent transition-all">
                                    <i data-lucide="${cert.icon}" class="w-4.5 h-4.5 accent-text opacity-80"></i>
                                </div>
                                <div class="flex flex-col min-w-0">
                                    <span class="text-[0.8rem] font-black uppercase tracking-tight text-[var(--text-main)] truncate">${cert.name}</span>
                                    <span class="text-[0.65rem] opacity-40 uppercase tracking-widest truncate">${cert.issuer} • ${cert.year}</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </section>`, 'delay-600');

  const qrSection = !isInteractive ? flip(`
                <section class="flex flex-col gap-6 no-break reveal text-left" style="animation-delay: 0.7s">
                    <div class="flex items-center gap-4 px-4 text-left"><i data-lucide="qr-code" class="w-5 h-5 accent-text"></i><h2 class="section-title" style="font-family: var(--font-sans);">${t1.qrTitle}</h2></div>
                    <div class="card p-6 flex flex-col gap-4">
                        <div class="flex flex-col gap-2">
                            <div class="text-sm font-bold uppercase tracking-widest text-[var(--text-main)]">${t1.qrTitle}</div>
                            <div class="text-[0.75rem] opacity-70">${t1.qrText}</div>
                        </div>
                        <div class="qr-image-wrap">
                            <img src="${qrDataURI}" alt="${t1.qrTitle}" class="qr-image">
                        </div>
                    </div>
                </section>`,
                `<section class="flex flex-col gap-6 no-break text-left">
                    <div class="flex items-center gap-4 px-4 text-left"><i data-lucide="qr-code" class="w-5 h-5 accent-text"></i><h2 class="section-title" style="font-family: var(--font-sans);">${t2.qrTitle}</h2></div>
                    <div class="card p-6 flex flex-col gap-4">
                        <div class="flex flex-col gap-2">
                            <div class="text-sm font-bold uppercase tracking-widest text-[var(--text-main)]">${t2.qrTitle}</div>
                            <div class="text-[0.75rem] opacity-70">${t2.qrText}</div>
                        </div>
                        <div class="qr-image-wrap">
                            <img src="${qrDataURI}" alt="${t2.qrTitle}" class="qr-image">
                        </div>
                    </div>
                </section>`, 'delay-700') : '';

  const profileSection = flip(`
                <section class="flex flex-col gap-6 no-break text-left reveal" style="animation-delay: 0.1s">
                    <div class="flex items-center gap-4 px-4 text-left"><i data-lucide="terminal" class="w-5 h-5 accent-text"></i><h2 class="section-title" style="font-family: var(--font-sans);">${t1.profile}</h2></div>
                    <div class="card p-12 text-left text-[1.05rem] leading-relaxed opacity-80 font-medium">${renderSummaryHtml(data.summary[lang])}</div>
                </section>`,
                `<section class="flex flex-col gap-6 no-break text-left">
                    <div class="flex items-center gap-4 px-4 text-left"><i data-lucide="terminal" class="w-5 h-5 accent-text"></i><h2 class="section-title" style="font-family: var(--font-sans);">${t2.profile}</h2></div>
                    <div class="card p-12 text-left text-[1.05rem] leading-relaxed opacity-80 font-medium">${renderSummaryHtml(data.summary[lang2])}</div>
                </section>`, 'delay-200');

  const mainContent = isInteractive ? `
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start text-left">
            <div class="lg:col-span-4 flex flex-col gap-8 text-left">
                ${contactSection}
                ${expertiseOverviewSection}
                ${languagesSection}
                ${personalSkillsSection}
                ${educationSection}
                ${certificationsSection}
                ${qrSection}
            </div>
            <div class="lg:col-span-8 flex flex-col gap-8 text-left">
                ${profileSection}
                ${renderProSkillsSection(data.skills.professional, 'delay-300')}
                ${renderExperienceSection(data.experiences, 'delay-400')}
            </div>
        </div>
    ` : `
        <div class="pdf-pages">
            <div class="pdf-page">
                <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start text-left">
                    <div class="lg:col-span-4 flex flex-col gap-8 text-left">
                        ${contactSection}
                        ${languagesSection}
                        ${educationSection}
                    </div>
                    <div class="lg:col-span-8 flex flex-col gap-8 text-left">
                        ${profileSection}
                        ${renderProSkillsSection(proSkillsPrimary)}
                    </div>
                </div>
            </div>
            <div class="pdf-page">
                <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start text-left">
                    <div class="lg:col-span-4 flex flex-col gap-8 text-left">
                        ${personalSkillsSection}
                        ${certificationsSection}
                        ${qrSection}
                    </div>
                    <div class="lg:col-span-8 flex flex-col gap-8 text-left">
                        ${proSkillsSecondary.length ? renderProSkillsSection(proSkillsSecondary) : ''}
                        ${renderExperienceSection(experiencesPage1)}
                    </div>
                </div>
            </div>
            <div class="pdf-page">
                <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start text-left">
                    <div class="lg:col-span-4 flex flex-col gap-8 text-left"></div>
                    <div class="lg:col-span-8 flex flex-col gap-8 text-left">
                        ${renderExperienceSection(experiencesPage2)}
                    </div>
                </div>
            </div>
            ${experiencesPage3.length ? `
            <div class="pdf-page">
                <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start text-left">
                    <div class="lg:col-span-4 flex flex-col gap-8 text-left"></div>
                    <div class="lg:col-span-8 flex flex-col gap-8 text-left">
                        ${renderExperienceSection(experiencesPage3)}
                    </div>
                </div>
            </div>
            ` : ''}
        </div>
    `;
  
  return `<!DOCTYPE html>
<html lang="${lang}" class="dark" id="html-root" style="${rootStyle}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${c.name} - ${c.title[lang]}</title>

    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=Montserrat:wght@100..900&display=swap" onload="this.onload=null;this.rel='stylesheet'">
    <noscript><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Montserrat:wght@100..900&display=swap"></noscript>
    
    <!-- SEO & Canonical -->
    <link rel="canonical" href="${canonicalUrl}" />
    <link rel="alternate" hreflang="${lang}" href="https://tomzone.fr/index_${lang}.html" />
    <link rel="alternate" hreflang="${lang2}" href="https://tomzone.fr/index_${lang2}.html" />
    <link rel="alternate" hreflang="x-default" href="https://tomzone.fr/" />
    <meta name="description" content="${t1.seoDescription}">
    <meta name="keywords" content="${t1.seoKeywords}">
    <meta name="author" content="${c.name}">
    <meta name="robots" content="index,follow">
    <meta name="theme-color" content="${accent}">

    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website">
    <meta property="og:url" content="${canonicalUrl}">
    <meta property="og:title" content="${c.name} - ${c.title[lang]}">
    <meta property="og:description" content="${t1.ogDescription}">
    <meta property="og:image" content="https://tomzone.fr/preview_${lang}.png">
    <meta property="og:site_name" content="${c.name} Portfolio">
    <meta property="og:locale" content="${ogLocale}">
    <meta property="og:locale:alternate" content="${ogLocaleAlt}">

    <!-- Twitter -->
    <meta property="twitter:card" content="summary_large_image">
    <meta property="twitter:url" content="${canonicalUrl}">
    <meta property="twitter:title" content="${c.name} - ${c.title[lang]}">
    <meta property="twitter:description" content="${t1.twitterDescription}">
    <meta property="twitter:image" content="https://tomzone.fr/preview_${lang}.png">

    <link rel="icon" href="assets/favicon.ico">
    <link rel="icon" type="image/png" sizes="32x32" href="assets/favicon-32.png">
    <link rel="icon" type="image/png" sizes="16x16" href="assets/favicon-16.png">
    <link rel="apple-touch-icon" sizes="180x180" href="assets/apple-touch-icon.png">
    
    <!-- Offline Assets (Inlined for PDF stability) -->
    <script>
        ${fs.existsSync(path.join(__dirname, '../../assets', 'tailwind.js')) ? fs.readFileSync(path.join(__dirname, '../../assets', 'tailwind.js'), 'utf8') : ''}
    </script>
    <script>
        ${fs.existsSync(path.join(__dirname, '../../assets', 'lucide.js')) ? fs.readFileSync(path.join(__dirname, '../../assets', 'lucide.js'), 'utf8') : ''}
    </script>

    <style>
        ${baseStyles}
    </style>
</head>
<body class="p-4 md:p-8 lg:p-12 theme-${theme} font-architect ${isInteractive ? '' : 'pdf-mode'}" id="body-root" data-title-fr="${c.name} - ${c.title.fr}" data-title-en="${c.name} - ${c.title.en}">
    <canvas id="matrix-canvas" class="no-print" aria-hidden="true"></canvas>
    <div class="matrix-dimmer no-print" aria-hidden="true"></div>
    
    <!-- Reading Progress Bar -->
    <div class="fixed top-0 left-0 w-full h-1 z-[9999] no-print">
        <div id="progress-bar" class="h-full accent-bg shadow-[0_0_10px_var(--accent)] transition-all duration-100 ease-out" style="width: 0%"></div>
    </div>

    <!-- Welcome Modal -->
    <div id="welcome-modal" class="fixed inset-0 z-[9999] w-full h-full bg-black/60 backdrop-blur-md flex items-center justify-center p-4 opacity-0 pointer-events-none transition-opacity duration-500 no-print">
        <div class="bg-[var(--bg-card)] border border-[var(--border-card)] rounded-3xl shadow-2xl p-8 max-w-md w-full transform scale-95 transition-transform duration-500 text-center relative overflow-hidden group/modal">
            <!-- Decoration -->
            <div class="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[var(--accent)] to-purple-500"></div>
            
            <button class="welcome-close" onclick="closeWelcome()" aria-label="Close welcome modal"><i data-lucide="x" class="w-4 h-4"></i></button>

            <div class="mb-8 mt-2">
                <div class="w-20 h-20 bg-[var(--bg-page)] rounded-2xl border border-[var(--border-card)] flex items-center justify-center mx-auto mb-5 text-[var(--accent)] shadow-[0_0_30px_rgba(var(--accent-rgba),0.15)]">
                    <i data-lucide="file-user" class="w-10 h-10"></i>
                </div>
                <h2 class="text-3xl font-black uppercase tracking-tight text-[var(--text-main)] mb-1" id="w-title">Thomas Bourcey</h2>
                <p class="text-sm opacity-60 font-mono font-bold uppercase tracking-widest" id="w-subtitle">Interactive Resume</p>
            </div>

            <!-- Settings Grid -->
            <div class="space-y-5 mb-8">
                <div class="grid grid-cols-2 gap-4">
                    <!-- Lang -->
                    <div class="space-y-2">
                        <label class="text-[0.6rem] font-black uppercase tracking-widest opacity-40">Language</label>
                        <div class="grid grid-cols-2 bg-[var(--bg-page)] rounded-xl p-1.5 border border-[var(--border-card)] gap-1">
                            <button id="w-lang-fr" onclick="setWelcomeLang('fr'); resetWelcomeTimer()" class="py-2.5 rounded-lg text-xs font-bold transition-all hover:bg-[var(--bg-card)] hover:shadow-sm opacity-50 flex items-center justify-center gap-2"><span>🇫🇷</span> FR</button>
                            <button id="w-lang-en" onclick="setWelcomeLang('en'); resetWelcomeTimer()" class="py-2.5 rounded-lg text-xs font-bold transition-all hover:bg-[var(--bg-card)] hover:shadow-sm opacity-50 flex items-center justify-center gap-2"><span>🇬🇧</span> EN</button>
                        </div>
                    </div>
                     <!-- Theme -->
                    <div class="space-y-2">
                        <label class="text-[0.6rem] font-black uppercase tracking-widest opacity-40">Theme</label>
                        <div class="grid grid-cols-3 bg-[var(--bg-page)] rounded-xl p-1.5 border border-[var(--border-card)] gap-1">
                             <button onclick="setTheme('light'); resetWelcomeTimer()" class="py-2 rounded-lg flex items-center justify-center hover:bg-[var(--bg-card)] hover:shadow-sm transition-all text-[var(--text-main)] opacity-70 hover:opacity-100"><i data-lucide="sun" class="w-5 h-5"></i></button>
                             <button onclick="setTheme('deep'); resetWelcomeTimer()" class="py-2 rounded-lg flex items-center justify-center hover:bg-[var(--bg-card)] hover:shadow-sm transition-all text-[var(--text-main)] opacity-70 hover:opacity-100"><i data-lucide="moon" class="w-5 h-5"></i></button>
                             <button onclick="setTheme('dark'); resetWelcomeTimer()" class="py-2 rounded-lg flex items-center justify-center hover:bg-[var(--bg-card)] hover:shadow-sm transition-all text-[var(--text-main)] opacity-70 hover:opacity-100"><i data-lucide="zap" class="w-5 h-5"></i></button>
                        </div>
                    </div>
                </div>

                <!-- Color Picker -->
                <div class="space-y-2">
                    <label class="text-[0.6rem] font-black uppercase tracking-widest opacity-40">Accent Color</label>
                    <div class="flex flex-wrap justify-center gap-3" id="w-accent-picker">
                        <!-- Injected by JS -->
                    </div>
                </div>
            </div>

            <button onclick="closeWelcome()" class="w-full py-4 rounded-xl bg-[var(--accent)] text-white font-black uppercase tracking-widest shadow-[0_10px_20px_-5px_rgba(var(--accent-rgba),0.4)] hover:shadow-[0_15px_30px_-5px_rgba(var(--accent-rgba),0.5)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 group relative overflow-hidden">
                <span id="w-btn" class="relative z-10">Start Exploring</span>
                <i data-lucide="arrow-right" class="w-4 h-4 group-hover:translate-x-1 transition-transform relative z-10"></i>
                <div id="w-timer-bar" class="absolute inset-0 bg-white/20 w-0 transition-all duration-[15000ms] ease-linear pointer-events-none shadow-[0_0_18px_rgba(255,255,255,0.35)]"></div>
                <div id="w-timer-bar-line" class="absolute bottom-0 left-0 h-1 bg-white/60 w-0 transition-all duration-[15000ms] ease-linear pointer-events-none"></div>
            </button>
        </div>
    </div>

    <div id="settings-hint" class="no-print" aria-live="polite">
        <div class="hint-arrow"></div>
        <button class="hint-close" onclick="hideSettingsHint()" aria-label="Close settings hint"><i data-lucide="x" class="w-4 h-4"></i></button>
        <div class="flex items-start gap-3 mb-3">
            <div class="w-9 h-9 rounded-xl surface-muted flex items-center justify-center shrink-0 border border-[var(--border-card)] text-[var(--accent)]">
                <i data-lucide="sparkles" class="w-4 h-4"></i>
            </div>
            <div>
                <div class="text-sm font-black uppercase tracking-widest text-[var(--text-main)]">${t1.settingsHintTitle}</div>
                <div class="text-[0.7rem] opacity-60 font-mono uppercase tracking-[0.3em]">${t1.settingsHintSubtitle}</div>
            </div>
        </div>
        <p class="text-[0.75rem] opacity-70 mb-3">${t1.settingsHintText}</p>
        <div class="grid grid-cols-2 gap-2 text-[0.75rem]">
            ${t1.settingsHintItems.map((item, idx) => `
            <div class="flex items-center gap-2 p-2 rounded-xl surface-muted border border-[var(--border-card)]">
                <i data-lucide="${settingsHintIcons[idx] || 'settings'}" class="w-4 h-4 accent-text"></i>
                <span class="text-[var(--text-main)] font-semibold">${item}</span>
            </div>`).join('')}
        </div>
    </div>

    <div id="settings-panel" class="no-print" aria-label="${t1.settingsPanelAria}">
        <div class="panel-top">
            <div class="panel-heading">
                <span class="panel-kicker">${t1.settingsPanelKicker}</span>
                <span class="panel-title">${t1.settingsPanelTitle}</span>
            </div>
            <button type="button" class="settings-close" data-settings-close="true" onclick="toggleSettings(event)" aria-label="${t1.settingsCloseTitle}" title="${t1.settingsCloseTitle}">
                <i data-lucide="x" class="w-4 h-4"></i>
            </button>
        </div>
        <div class="panel-handle md:hidden"></div>

        <div class="settings-content">
        
        <label class="text-[10px] font-black uppercase tracking-widest opacity-50 mb-3 block text-center">${t1.settingsLabelLanguage}</label>
        <div class="grid grid-cols-2 p-1 bg-[var(--bg-page)] rounded-xl border border-[var(--border-card)] mb-8 relative gap-1">
            <button id="btn-lang-fr" onclick="if(!this.classList.contains('active-lang')) toggleLanguage()" class="py-2 rounded-lg text-[10px] font-bold uppercase transition-all ${lang === 'fr' ? 'active-lang bg-[var(--bg-card)] text-[var(--text-main)] shadow-lg' : 'opacity-50 hover:opacity-100'} flex items-center justify-center gap-2 cursor-pointer">
                <img src="assets/flags/fr.svg" alt="" class="flag-icon" aria-hidden="true"> ${t1.settingsLangFrench}
            </button>
            <button id="btn-lang-en" onclick="if(!this.classList.contains('active-lang')) toggleLanguage()" class="py-2 rounded-lg text-[10px] font-bold uppercase transition-all ${lang === 'en' ? 'active-lang bg-[var(--bg-card)] text-[var(--text-main)] shadow-lg' : 'opacity-50 hover:opacity-100'} flex items-center justify-center gap-2 cursor-pointer">
                <img src="assets/flags/gb.svg" alt="" class="flag-icon" aria-hidden="true"> ${t1.settingsLangEnglish}
            </button>
        </div>

        <label class="text-[10px] font-black uppercase tracking-widest opacity-50 mb-3 block text-center">${t1.settingsLabelAppearance}</label>
        <div class="appearance-grid mb-8">
            <button onclick="setTheme('light')" class="appearance-option" id="btn-light" data-theme="light">
                <i data-lucide="sun" class="w-4 h-4"></i>
                <span>${t1.settingsThemeLight}</span>
            </button>
            <button onclick="setTheme('deep')" class="appearance-option" id="btn-deep" data-theme="deep">
                <i data-lucide="moon" class="w-4 h-4"></i>
                <span>${t1.settingsThemeDeep}</span>
            </button>
            <button onclick="setTheme('dark')" class="appearance-option" id="btn-dark" data-theme="dark">
                <i data-lucide="zap" class="w-4 h-4"></i>
                <span>${t1.settingsThemeDark}</span>
            </button>
        </div>

        <label class="text-[10px] font-black uppercase tracking-widest opacity-50 mb-3 block text-center">${t1.settingsLabelAccent}</label>
        <div class="accent-grid mb-8" id="accent-picker"></div>

        <label class="text-[10px] font-black uppercase tracking-widest opacity-50 mb-3 block text-center">${t1.settingsLabelScale}</label>
        <div class="flex items-center gap-4 px-2 mb-8 text-white">
            <span style="font-size: 12px !important; color: inherit;" class="font-serif italic opacity-40">a</span>
            <input type="range" min="12" max="20" value="15" step="1" oninput="setFontSize(this.value)" class="flex-grow" aria-label="${t1.settingsLabelScale}">
            <span style="font-size: 20px !important; color: inherit;" class="font-serif italic opacity-40">A</span>
        </div>

        <label class="text-[10px] font-black uppercase tracking-widest opacity-50 mb-3 block text-center">${t1.settingsLabelSystem}</label>
        <div class="grid grid-cols-2 p-1 bg-[var(--bg-page)] rounded-xl border border-[var(--border-card)] mb-8 relative gap-1 system-toggle">
            <button onclick="updateTTY(false)" id="btn-std" class="system-btn flex items-center justify-center gap-2">
                <i data-lucide="monitor" class="w-3 h-3"></i> ${t1.settingsSystemStandard}
            </button>
            <button onclick="updateTTY(true)" id="btn-matrix" class="system-btn flex items-center justify-center gap-2">
                <i data-lucide="terminal" class="w-3 h-3"></i> ${t1.settingsSystemMatrix}
            </button>
        </div>

        <label class="text-[10px] font-black uppercase tracking-widest opacity-50 mb-3 block text-center">${t1.settingsLabelAccessibility}</label>
        <div class="accessibility-card mb-8">
            <div class="flex items-center gap-3">
                <div class="accessibility-icon">
                    <i data-lucide="eye" class="w-4 h-4"></i>
                </div>
                <div>
                    <div class="text-[0.7rem] font-black uppercase tracking-[0.2em] text-[var(--text-main)]">${t1.settingsAccessibilityTitle}</div>
                    <div class="text-[0.7rem] text-[var(--text-muted)] opacity-70">${t1.settingsAccessibilityDescription}</div>
                </div>
            </div>
                <label class="switch">
                    <input type="checkbox" id="toggle-contrast" onchange="setContrast(this.checked)" aria-label="${t1.settingsAccessibilityTitle}">
                    <span class="slider"></span>
                </label>
        </div>

        <label class="text-[10px] font-black uppercase tracking-widest opacity-50 mb-3 block text-center">${t1.settingsLabelFontStack}</label>
        <div class="font-grid">
            <button onclick="setFontStack('architect')" class="panel-btn font-btn" id="f-architect">ARCHI</button>
            <button onclick="setFontStack('archivo')" class="panel-btn font-btn" id="f-archivo">ARCHIV</button>
            <button onclick="setFontStack('console')" class="panel-btn font-btn" id="f-console">CONSOL</button>
            <button onclick="setFontStack('geist')" class="panel-btn font-btn" id="f-geist">GEIST</button>
            <button onclick="setFontStack('hub')" class="panel-btn font-btn" id="f-hub">HUB</button>
            <button onclick="setFontStack('oxy')" class="panel-btn font-btn" id="f-oxy">OXY</button>
            <button onclick="setFontStack('quantum')" class="panel-btn font-btn" id="f-quantum">QUANT</button>
            <button onclick="setFontStack('space')" class="panel-btn font-btn" id="f-space">SPACE</button>
        </div>
        </div>

        ${isInteractive ? `
        <div class="settings-footer">
            <button id="debug-clear" class="no-print" onclick="clearDebugState()" aria-label="Clear debug storage">
                <i data-lucide="trash-2" class="w-4 h-4"></i>
                <span class="text-[0.75rem] font-bold uppercase tracking-widest">${t1.settingsClearLabel}</span>
            </button>
            <div class="border-t border-[var(--border-card)] pt-4 mt-4 text-center no-print">
                <div class="flex flex-col gap-3 items-center justify-center">
                    <div class="flex items-center gap-2 text-[0.7rem] font-mono opacity-60">
                        <span>${t1.developedWith}</span>
                        <i data-lucide="heart" class="w-3.5 h-3.5 text-rose-500 fill-rose-500/20 animate-pulse"></i>
                        <span>&</span>
                        <i data-lucide="bot" class="w-3.5 h-3.5 text-[var(--accent)]"></i>
                        <span>${t1.inYear} ${new Date().getFullYear()}</span>
                    </div>
                    <div class="text-[9px] uppercase tracking-widest opacity-40">
                        ${t1.lastUpdate}: ${new Date().toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>
                    <a href="https://github.com/SckyzO/SckyzO" target="_blank" class="inline-flex items-center gap-2 px-3 py-2 rounded-xl surface-muted border border-[var(--border-card)] hover:border-accent/50 hover:bg-accent/5 transition-all text-[9px] font-bold uppercase tracking-widest group">
                        <i data-lucide="github" class="w-3 h-3 group-hover:accent-text transition-colors"></i>
                        <span class="group-hover:text-[var(--text-main)] transition-colors">${t1.sourceCode}</span>
                    </a>
                </div>
            </div>
        </div>
        ` : ''}
    </div>

    <div class="max-w-7xl mx-auto flex flex-col gap-12 text-left content-root">
        ${flip(`
        <header class="card p-0 relative group min-h-[280px] flex flex-col md:flex-row items-center !overflow-visible no-break" style="animation-delay: 0s">
            <button onclick="toggleSettings(event)" class="cog-btn-inline no-print settings-trigger" id="main-cog-mobile" data-lang="fr" aria-label="${t1.settingsOpenAria}">
                <span class="cog-icon"><i data-lucide="settings" style="width: 22px; height: 22px;"></i></span>
            </button>
            <!-- Background Layer (Clipped) -->
            <div class="absolute inset-0 rounded-[2.5rem] overflow-hidden pointer-events-none z-0">
                <div class="absolute -top-24 -right-24 p-12 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity rotate-12"><i data-lucide="server" style="width: 300px; height: 300px;"></i></div>
            </div>

            <!-- Left: Avatar Zone (Z-10) -->
            <div class="relative shrink-0 p-10 md:p-12 z-10 header-zone">
                <div class="p-1.5 rounded-full avatar-ring">
                    <div class="w-52 h-52 rounded-full surface-muted border-4 border-[var(--bg-card)] shadow-2xl overflow-hidden relative z-10 group-hover:scale-[1.02] transition-transform duration-500 header-avatar">
                        <picture>
                            <source srcset="assets/tom_avatar.webp" type="image/webp">
                            <img src="assets/tom_avatar.png" alt="Thomas Bourcey" class="w-full h-full object-cover">
                        </picture>
                    </div>
                </div>
                <div class="absolute bottom-8 right-8 md:bottom-16 md:right-16 w-7 h-7 bg-emerald-500 border-4 border-[var(--bg-card)] rounded-full z-20 shadow-lg" title="Open to opportunities"></div>
            </div>

            <!-- Right: Info Zone (Z-20 for Dropdown) -->
            <div class="flex flex-col justify-center text-center md:text-left flex-grow relative z-20 p-10 md:p-12">

                <!-- Top Badges -->
                <div class="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-6 no-print">
                    <span class="px-3 py-1 rounded-full surface-muted border border-[var(--border-card)] text-[0.65rem] font-bold uppercase tracking-widest text-[var(--text-muted)] flex items-center gap-2">
                        <i data-lucide="medal" class="w-3 h-3 accent-text"></i> Senior Engineer
                    </span>
                    <span class="px-3 py-1 rounded-full surface-muted border border-[var(--border-card)] text-[0.65rem] font-bold uppercase tracking-widest text-[var(--text-muted)] flex items-center gap-2">
                        <i data-lucide="map-pin" class="w-3 h-3 accent-text"></i> Toulouse, FR
                    </span>
                    ${activity ? `
                    <a href="https://github.com/${c.github}/${activity.repo}" target="_blank" class="px-3 py-1 rounded-full surface-muted border border-[var(--border-card)] text-[0.65rem] font-bold uppercase tracking-widest text-[var(--text-muted)] flex items-center gap-2 hover:border-accent/50 hover:bg-accent/5 transition-all group/repo no-print has-tooltip">
                        <div class="relative flex items-center justify-center">
                            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-20"></span>
                            <i data-lucide="github" class="w-3 h-3 accent-text relative"></i>
                        </div>
                        <span class="group-hover/repo:text-[var(--text-main)] transition-colors"><span class="opacity-50 font-normal mr-1">${t1.lastCommit} :</span>${activity.repo}</span>
                        <span class="tooltip-content">${t1.goToRepo} ${activity.repo}</span>
                    </a>` : ''}
                </div>

                <h1 class="text-5xl md:text-7xl font-black tracking-tighter uppercase italic mb-3 leading-none text-[var(--text-main)]" style="font-family: var(--font-sans);">
                    THOMAS <span class="accent-text">BOURCEY</span>
                </h1>
                
                <p class="accent-text font-mono text-lg font-bold uppercase tracking-[0.2em] mb-8 opacity-90">
                    ${c.title[lang]}
                </p>

                <!-- Metrics Bar -->
                <div class="grid grid-cols-3 gap-4 border-t border-[var(--border-card)] pt-6 mt-2 md:flex md:justify-start md:gap-6">
                    <div class="flex flex-col items-center md:items-start gap-1">
                        <span class="text-2xl font-black text-[var(--text-main)] leading-none">20+</span>
                        <span class="text-[0.6rem] uppercase tracking-widest opacity-50 whitespace-nowrap">${t1.yearsExp}</span>
                    </div>
                    <div class="hidden md:block w-px h-10 bg-[var(--border-card)]"></div>
                    <div class="flex flex-col items-center md:items-start gap-1">
                        <span class="text-2xl font-black text-[var(--text-main)] leading-none">${data.certifications.length}</span>
                        <span class="text-[0.6rem] uppercase tracking-widest opacity-50 whitespace-nowrap">${t1.certifications}</span>
                    </div>
                    <div class="hidden md:block w-px h-10 bg-[var(--border-card)]"></div>
                    <div class="flex flex-col items-center md:items-start gap-1">
                        <span class="text-2xl font-black text-[var(--text-main)] leading-none">${activity ? activity.public_repos : data.projects.length}</span>
                        <span class="text-[0.6rem] uppercase tracking-widest opacity-50 whitespace-nowrap">${t1.publicRepos}</span>
                    </div>
                    
                    <div class="flex-grow"></div>
                    
                    <div class="relative group/dl z-20 hidden md:block no-print">
                        <div class="flex items-stretch rounded-xl surface-muted border border-[var(--border-card)] hover:border-accent transition-colors">
                            <a href="${pdfFilename}" download class="flex items-center gap-3 px-5 py-3 hover:bg-accent/5 transition-all rounded-l-xl">
                                <i data-lucide="download" class="w-4 h-4 accent-text"></i>
                                <span class="text-xs font-bold uppercase tracking-wide text-[var(--text-main)]">${t1.downloadPdf}</span>
                            </a>
                            <div class="w-px bg-[var(--border-card)]"></div>
                            <button class="px-2 hover:bg-accent/5 transition-all rounded-r-xl cursor-default">
                                <i data-lucide="chevron-down" class="w-4 h-4 opacity-50"></i>
                            </button>
                        </div>
                        
                        <div class="absolute top-full right-0 mt-2 w-48 bg-[var(--bg-card)] border border-[var(--border-card)] rounded-xl shadow-2xl opacity-0 invisible group-hover/dl:opacity-100 group-hover/dl:visible transition-all transform translate-y-2 group-hover/dl:translate-y-0 flex flex-col overflow-hidden backdrop-blur-md">
                            <a href="${pdfFilename}" download class="px-4 py-3 hover:bg-accent/5 flex items-center gap-3 text-[10px] font-bold uppercase tracking-wide text-[var(--text-main)] transition-colors">
                                <span class="w-3 h-3 rounded-full bg-[#f4f4f5] border border-slate-300"></span> Light (Default)
                            </a>
                            <a href="${pdfFilename.replace('.pdf', '_Deep.pdf')}" download class="px-4 py-3 hover:bg-accent/5 flex items-center gap-3 text-[10px] font-bold uppercase tracking-wide text-[var(--text-main)] transition-colors">
                                <span class="w-3 h-3 rounded-full bg-[#18181b] border border-white/20"></span> Deep
                            </a>
                            <a href="${pdfFilename.replace('.pdf', '_Dark.pdf')}" download class="px-4 py-3 hover:bg-accent/5 flex items-center gap-3 text-[10px] font-bold uppercase tracking-wide text-[var(--text-main)] transition-colors">
                                <span class="w-3 h-3 rounded-full bg-black border border-white/20"></span> Dark
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </header>`, 
        `
        <header class="card p-0 relative group min-h-[280px] flex flex-col md:flex-row items-center !overflow-visible no-break" style="animation-delay: 0s">
            <button onclick="toggleSettings(event)" class="cog-btn-inline no-print settings-trigger" id="main-cog-mobile-en" data-lang="en" aria-label="${t1.settingsOpenAria}">
                <span class="cog-icon"><i data-lucide="settings" style="width: 22px; height: 22px;"></i></span>
            </button>
            <!-- Background Layer (Clipped) -->
            <div class="absolute inset-0 rounded-[2.5rem] overflow-hidden pointer-events-none z-0">
                <div class="absolute -top-24 -right-24 p-12 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity rotate-12"><i data-lucide="server" style="width: 300px; height: 300px;"></i></div>
            </div>

            <!-- Left: Avatar Zone (Z-10) -->
            <div class="relative shrink-0 p-10 md:p-12 z-10 header-zone">
                <div class="p-1.5 rounded-full avatar-ring">
                    <div class="w-52 h-52 rounded-full surface-muted border-4 border-[var(--bg-card)] shadow-2xl overflow-hidden relative z-10 group-hover:scale-[1.02] transition-transform duration-500 header-avatar">
                        <picture>
                            <source srcset="assets/tom_avatar.webp" type="image/webp">
                            <img src="assets/tom_avatar.png" alt="Thomas Bourcey" class="w-full h-full object-cover">
                        </picture>
                    </div>
                </div>
                <div class="absolute bottom-8 right-8 md:bottom-16 md:right-16 w-7 h-7 bg-emerald-500 border-4 border-[var(--bg-card)] rounded-full z-20 shadow-lg" title="Open to opportunities"></div>
            </div>

            <!-- Right: Info Zone (Z-20 for Dropdown) -->
            <div class="flex flex-col justify-center text-center md:text-left flex-grow relative z-20 p-10 md:p-12">

                <!-- Top Badges -->
                <div class="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-6 no-print">
                    <span class="px-3 py-1 rounded-full surface-muted border border-[var(--border-card)] text-[0.65rem] font-bold uppercase tracking-widest text-[var(--text-muted)] flex items-center gap-2">
                        <i data-lucide="medal" class="w-3 h-3 accent-text"></i> Senior Engineer
                    </span>
                    <span class="px-3 py-1 rounded-full surface-muted border border-[var(--border-card)] text-[0.65rem] font-bold uppercase tracking-widest text-[var(--text-muted)] flex items-center gap-2">
                        <i data-lucide="map-pin" class="w-3 h-3 accent-text"></i> Toulouse, FR
                    </span>
                    ${activity ? `
                    <a href="https://github.com/${c.github}/${activity.repo}" target="_blank" class="px-3 py-1 rounded-full surface-muted border border-[var(--border-card)] text-[0.65rem] font-bold uppercase tracking-widest text-[var(--text-muted)] flex items-center gap-2 hover:border-accent/50 hover:bg-accent/5 transition-all group/repo no-print has-tooltip">
                        <div class="relative flex items-center justify-center">
                            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-20"></span>
                            <i data-lucide="github" class="w-3 h-3 accent-text relative"></i>
                        </div>
                        <span class="group-hover/repo:text-[var(--text-main)] transition-colors"><span class="opacity-50 font-normal mr-1">${t2.lastCommit} :</span>${activity.repo}</span>
                        <span class="tooltip-content">${t2.goToRepo} ${activity.repo}</span>
                    </a>` : ''}
                </div>

                <h1 class="text-5xl md:text-7xl font-black tracking-tighter uppercase italic mb-3 leading-none text-[var(--text-main)]" style="font-family: var(--font-sans);">
                    THOMAS <span class="accent-text">BOURCEY</span>
                </h1>
                
                <p class="accent-text font-mono text-lg font-bold uppercase tracking-[0.2em] mb-8 opacity-90">
                    ${c.title[lang2]}
                </p>

                <!-- Metrics Bar -->
                <div class="grid grid-cols-3 gap-4 border-t border-[var(--border-card)] pt-6 mt-2 md:flex md:justify-start md:gap-6">
                    <div class="flex flex-col items-center md:items-start gap-1">
                        <span class="text-2xl font-black text-[var(--text-main)] leading-none">20+</span>
                        <span class="text-[0.6rem] uppercase tracking-widest opacity-50 whitespace-nowrap">${t2.yearsExp}</span>
                    </div>
                    <div class="hidden md:block w-px h-10 bg-[var(--border-card)]"></div>
                    <div class="flex flex-col items-center md:items-start gap-1">
                        <span class="text-2xl font-black text-[var(--text-main)] leading-none">${data.certifications.length}</span>
                        <span class="text-[0.6rem] uppercase tracking-widest opacity-50 whitespace-nowrap">${t2.certifications}</span>
                    </div>
                    <div class="hidden md:block w-px h-10 bg-[var(--border-card)]"></div>
                    <div class="flex flex-col items-center md:items-start gap-1">
                        <span class="text-2xl font-black text-[var(--text-main)] leading-none">${activity ? activity.public_repos : data.projects.length}</span>
                        <span class="text-[0.6rem] uppercase tracking-widest opacity-50 whitespace-nowrap">${t2.publicRepos}</span>
                    </div>
                    
                    <div class="flex-grow"></div>
                    
                    <div class="relative group/dl z-20 hidden md:block no-print">
                        <div class="flex items-stretch rounded-xl surface-muted border border-[var(--border-card)] hover:border-accent transition-colors">
                            <a href="${lang === 'fr' ? 'Resume_Thomas_Bourcey_EN.pdf' : 'CV_Thomas_Bourcey_FR.pdf'}" download class="flex items-center gap-3 px-5 py-3 hover:bg-accent/5 transition-all rounded-l-xl">
                                <i data-lucide="download" class="w-4 h-4 accent-text"></i>
                                <span class="text-xs font-bold uppercase tracking-wide text-[var(--text-main)]">${t2.downloadPdf}</span>
                            </a>
                            <div class="w-px bg-[var(--border-card)]"></div>
                            <button class="px-2 hover:bg-accent/5 transition-all rounded-r-xl cursor-default">
                                <i data-lucide="chevron-down" class="w-4 h-4 opacity-50"></i>
                            </button>
                        </div>
                        
                        <div class="absolute top-full right-0 mt-2 w-48 bg-[var(--bg-card)] border border-[var(--border-card)] rounded-xl shadow-2xl opacity-0 invisible group-hover/dl:opacity-100 group-hover/dl:visible transition-all transform translate-y-2 group-hover/dl:translate-y-0 flex flex-col overflow-hidden backdrop-blur-md">
                            <a href="${lang === 'fr' ? 'Resume_Thomas_Bourcey_EN.pdf' : 'CV_Thomas_Bourcey_FR.pdf'}" download class="px-4 py-3 hover:bg-accent/5 flex items-center gap-3 text-[10px] font-bold uppercase tracking-wide text-[var(--text-main)] transition-colors">
                                <span class="w-3 h-3 rounded-full bg-[#f4f4f5] border border-slate-300"></span> Light (Default)
                            </a>
                            <a href="${(lang === 'fr' ? 'Resume_Thomas_Bourcey_EN.pdf' : 'CV_Thomas_Bourcey_FR.pdf').replace('.pdf', '_Deep.pdf')}" download class="px-4 py-3 hover:bg-accent/5 flex items-center gap-3 text-[10px] font-bold uppercase tracking-wide text-[var(--text-main)] transition-colors">
                                <span class="w-3 h-3 rounded-full bg-[#18181b] border border-white/20"></span> Deep
                            </a>
                            <a href="${(lang === 'fr' ? 'Resume_Thomas_Bourcey_EN.pdf' : 'CV_Thomas_Bourcey_FR.pdf').replace('.pdf', '_Dark.pdf')}" download class="px-4 py-3 hover:bg-accent/5 flex items-center gap-3 text-[10px] font-bold uppercase tracking-wide text-[var(--text-main)] transition-colors">
                                <span class="w-3 h-3 rounded-full bg-black border border-white/20"></span> Dark
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </header>`
        )}
        ${mainContent}

    <div id="cmd-palette" onclick="toggleCmd(false)">
        <div class="cmd-box" onclick="event.stopPropagation()">
            <input type="text" class="cmd-input" id="cmd-input" placeholder="Type a command or search..." autocomplete="off">
            <div class="cmd-results" id="cmd-results"></div>
        </div>
    </div>

    ${isInteractive ? `
    <script>
        ${clientScriptContent}
    </script>` : `
    <script>
        // Init Icons specifically for PDF/Static mode
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    </script>`}
</body>
</html>`;
}

// --- TEXT GENERATOR (ATS FRIENDLY) ---
function generatePlain(data, lang) {
  const t = i18n[lang];
  const c = data.contact;
  
  let txt = `${c.name.toUpperCase()}\n`;
  txt += `${c.title[lang].toUpperCase()}\n`;
  txt += `--------------------------------------------------\n\n`;
  
  txt += `CONTACT\n`;
  txt += `Location: ${c.location}\n`;
  txt += `Email: ${c.email}\n`;
  txt += `Website: https://${c.website}\n`;
  txt += `GitHub: https://github.com/${c.github}\n`;
  txt += `LinkedIn: https://linkedin.com/in/${c.linkedin}\n\n`;
  
  txt += `${t.profile.toUpperCase()}\n`;
  txt += `${summaryToText(data.summary[lang])}\n\n`;
  
  txt += `${t.experience.toUpperCase()}\n\n`;
  data.experiences.forEach(exp => {
    txt += `${exp.role[lang].toUpperCase()}\n`;
    txt += `${exp.company} | ${exp.period}\n`;
    txt += `${stripHtml(exp.summary[lang])}\n`; // Add summary text
    
    exp.domains.forEach(dom => {
        const domTitle = getLocalizedValue(dom.title, lang);
        txt += `\n* ${domTitle}\n`;
        dom.items[lang].forEach(item => {
             const { title, text } = parseItem(item);
             txt += `- ${title ? title + ': ' : ''}${stripHtml(text)}\n`;
        });
    });
    txt += `\n`;
  });
  
  txt += `${t.proSkills.toUpperCase()}\n`;
  data.skills.professional.forEach(s => {
    const categoryLabel = getLocalizedValue(s.category, lang);
    const tools = Array.isArray(s.tools) ? s.tools.join(', ') : s.tools;
    txt += `${categoryLabel}: ${tools}\n`;
  });
  
  txt += `\n${t.education.toUpperCase()}\n`;
  data.education.forEach(ed => {
    txt += `${ed.degree[lang]} | ${ed.school} (${ed.year})\n`;
  });

  txt += `\n${t.certifications.toUpperCase()}\n`;
  data.certifications.forEach(cert => txt += `- ${cert}\n`);
  
  return txt;
}

// --- MARKDOWN GENERATOR ---
function generateMarkdown(data, lang) {
  const t = i18n[lang]; const c = data.contact;
  let md = "# " + c.name + "\n"; md += "**" + c.title[lang] + "**\n\n"; md += "📍 " + c.location + "  \n";
  md += "📧 [" + c.email + "](mailto:" + c.email + ") | 🌐 [" + c.website + "](https://" + c.website + ")  \n";
  md += "🐙 [GitHub](https://github.com/" + c.github + ") | 🔗 [LinkedIn](https://linkedin.com/in/" + c.linkedin + ")\n\n";
  md += "## " + t.profile + "\n" + summaryToText(data.summary[lang]) + "\n\n";
  md += "## " + t.experience + "\n\n";
  data.experiences.forEach(exp => {
    md += "### " + exp.role[lang] + " | " + exp.company + "\n*" + exp.period + "*\n\n";
    md += "> " + stripHtml(exp.summary[lang]) + "\n\n"; // Add summary
    
    exp.domains.forEach(dom => {
        const domTitle = getLocalizedValue(dom.title, lang);
        md += "**" + domTitle + "**\n";
        dom.items[lang].forEach(item => {
             const { title, text } = parseItem(item);
             md += "- " + (title ? "**" + title + "**: " : "") + stripHtml(text) + "\n";
        });
        md += "\n";
    });
    md += "\n";
  });
  md += "## " + t.proSkills + "\n";
  data.skills.professional.forEach(s => {
    const categoryLabel = getLocalizedValue(s.category, lang);
    const tools = Array.isArray(s.tools) ? s.tools.join(', ') : s.tools;
    md += "- **" + categoryLabel + "**: " + tools + "\n";
  });
  md += "\n## " + t.certifications + "\n"; data.certifications.forEach(cert => md += "- " + cert + "\n");
  md += "\n"; return md;
}

module.exports = { generateHTML, generatePlain, generateMarkdown };
