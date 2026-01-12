const colors = [ 
    { name: 'Red', value: '239, 68, 68', hex: '#ef4444' }, 
    { name: 'Orange', value: '249, 115, 22', hex: '#f97316' }, 
    { name: 'Amber', value: '245, 158, 11', hex: '#f59e0b' }, 
    { name: 'Emerald', value: '16, 185, 129', hex: '#10b981' }, 
    { name: 'Cyan', value: '6, 182, 212', hex: '#06b6d4' }, 
    { name: 'Blue', value: '59, 130, 246', hex: '#3b82f6' }, 
    { name: 'Violet', value: '139, 92, 246', hex: '#8b5cf6' }, 
    { name: 'Rose', value: '244, 63, 94', hex: '#f43f5e' } 
];
const defaultAccent = '#3b82f6';
const defaultAccentRgba = '59, 130, 246';

// Initialisation immédiate des icônes
try { lucide.createIcons(); } catch(e) { console.error("Lucide init failed", e); }

function toggleSettings() {
    const panel = document.getElementById('settings-panel');
    const btn = document.getElementById('main-cog');
    const isOpen = panel.classList.toggle('open');
    
    // Accessibility & Scroll Lock
    if (isOpen) {
        document.body.style.overflow = 'hidden'; // Lock scroll
        btn.setAttribute('aria-expanded', 'true');
        
        // Focus Trap simple
        const focusableElements = panel.querySelectorAll('button, input, [href], select, textarea, [tabindex]:not([tabindex="-1"])');
        if (focusableElements.length) focusableElements[0].focus();
    } else {
        document.body.style.overflow = ''; // Unlock scroll
        btn.setAttribute('aria-expanded', 'false');
        btn.focus(); // Return focus to trigger button
    }
}

function updateToggleUI(type, state) {
    const activeClass = "flex-1 py-2 rounded-lg text-[10px] font-bold uppercase transition-all bg-[var(--bg-card)] text-[var(--text-main)] shadow-lg flex items-center justify-center gap-2 cursor-default active-lang";
    const inactiveClass = "flex-1 py-2 rounded-lg text-[10px] font-bold uppercase transition-all opacity-50 hover:opacity-100 flex items-center justify-center gap-2 cursor-pointer";

    // Auto-close on mobile
    if (window.innerWidth <= 768) {
        toggleSettings();
    }

    if (type === 'lang') {
        const btnFr = document.getElementById('btn-lang-fr');
        const btnEn = document.getElementById('btn-lang-en');
        if (btnFr && btnEn) {
            const isFrActive = btnFr.classList.contains('active-lang');
            const body = document.getElementById('body-root');
            if (isFrActive) {
                btnFr.className = inactiveClass;
                btnEn.className = activeClass;
                document.documentElement.lang = 'en';
                if (body && body.dataset.titleEn) document.title = body.dataset.titleEn;
            } else {
                btnFr.className = activeClass;
                btnEn.className = inactiveClass;
                document.documentElement.lang = 'fr';
                if (body && body.dataset.titleFr) document.title = body.dataset.titleFr;
            }
        }
    } else if (type === 'tty') {
        const btnStd = document.getElementById('btn-std');
        const btnMatrix = document.getElementById('btn-matrix');
        if (btnStd && btnMatrix) {
            if (state) {
                btnMatrix.className = activeClass;
                btnStd.className = inactiveClass;
            } else {
                btnStd.className = activeClass;
                btnMatrix.className = inactiveClass;
            }
        }
    }
}

function toggleLanguage() {
    document.querySelectorAll('.flip-container').forEach(el => el.classList.toggle('flipped'));
    updateToggleUI('lang');
}

function setTheme(t) {
    const b = document.getElementById('body-root');
    b.classList.remove('theme-light', 'theme-deep', 'theme-dark');
    b.classList.add('theme-' + t);
    localStorage.setItem('cv-theme', t);
}

function setAccent(hex) {
    const color = colors.find(c => c.hex === hex);
    const accentHex = color ? color.hex : defaultAccent;
    const accentRgba = color ? color.value : defaultAccentRgba;
    document.documentElement.style.setProperty('--accent', accentHex);
    document.documentElement.style.setProperty('--accent-rgba', accentRgba);
    localStorage.setItem('cv-accent', accentHex);
}

function setFontSize(s) {
    document.getElementById('html-root').style.fontSize = s + 'px';
    localStorage.setItem('cv-font-size', s);
}

function setFontStack(f) {
    const b = document.getElementById('body-root');
    b.classList.remove('font-hub', 'font-geist', 'font-space', 'font-archivo', 'font-quantum', 'font-console', 'font-architect', 'font-oxy');
    b.classList.add('font-' + f);
    localStorage.setItem('cv-font-stack', f);
}

// Welcome Modal Logic
let welcomeTimer = null;
const WELCOME_TIMEOUT_MS = 15000;
const SETTINGS_HINT_TIMEOUT_MS = 15000;

window.resetWelcomeTimer = function() {
    if (welcomeTimer) {
        clearTimeout(welcomeTimer);
        welcomeTimer = null;
        const bar = document.getElementById('w-timer-bar');
        const line = document.getElementById('w-timer-bar-line');
        if (bar) bar.style.width = '0%'; // Stop progress bar
        if (line) line.style.width = '0%'; // Stop progress line
    }
};

window.setWelcomeLang = function(lang) {
    const btnFr = document.getElementById('w-lang-fr');
    const btnEn = document.getElementById('w-lang-en');
    const title = document.getElementById('w-title');
    const sub = document.getElementById('w-subtitle');
    const btn = document.getElementById('w-btn');

    // Update Buttons UI
    if (lang === 'fr') {
        btnFr.classList.remove('opacity-50'); btnFr.classList.add('bg-[var(--bg-card)]', 'shadow-sm', 'text-[var(--text-main)]');
        btnEn.classList.add('opacity-50'); btnEn.classList.remove('bg-[var(--bg-card)]', 'shadow-sm', 'text-[var(--text-main)]');
        
        // Update Text
        title.innerText = "Thomas Bourcey";
        sub.innerText = "CV Interactif - Senior Engineer";
        btn.innerText = "Commencer l'exploration";
        
        // Trigger generic lang toggle if needed
        const currentLang = document.documentElement.lang;
        if (currentLang !== 'fr') toggleLanguage();
    } else {
        btnEn.classList.remove('opacity-50'); btnEn.classList.add('bg-[var(--bg-card)]', 'shadow-sm', 'text-[var(--text-main)]');
        btnFr.classList.add('opacity-50'); btnFr.classList.remove('bg-[var(--bg-card)]', 'shadow-sm', 'text-[var(--text-main)]');
        
        title.innerText = "Thomas Bourcey";
        sub.innerText = "Interactive Resume - Senior Engineer";
        btn.innerText = "Start Exploring";

        const currentLang = document.documentElement.lang;
        if (currentLang !== 'en') toggleLanguage();
    }
};

window.closeWelcome = function() {
    resetWelcomeTimer();
    const m = document.getElementById('welcome-modal');
    m.style.opacity = '0';
    m.style.pointerEvents = 'none';
    setTimeout(() => { m.style.display = 'none'; }, 500);
    localStorage.setItem('cv-visited', 'true');
    showSettingsHint();
    
    // Pulse settings cog to show where it is
    const cog = document.getElementById('main-cog');
    if (cog) {
        cog.classList.add('aura-pulse');
        setTimeout(() => cog.classList.remove('aura-pulse'), 2000);
    }
};

function showSettingsHint() {
    const hint = document.getElementById('settings-hint');
    if (!hint) return;
    if (localStorage.getItem('cv-settings-hint') === 'true') return;
    hint.classList.add('show');
    positionSettingsHint();
    localStorage.setItem('cv-settings-hint', 'true');
    setTimeout(() => hideSettingsHint(), SETTINGS_HINT_TIMEOUT_MS);
}

window.hideSettingsHint = function() {
    const hint = document.getElementById('settings-hint');
    if (!hint) return;
    hint.classList.remove('show');
};

window.clearDebugState = function() {
    localStorage.removeItem('cv-visited');
    localStorage.removeItem('cv-settings-hint');
    localStorage.removeItem('cv-theme');
    localStorage.removeItem('cv-accent');
    localStorage.removeItem('cv-font-size');
    localStorage.removeItem('cv-font-stack');
    localStorage.removeItem('cv-tty');
    window.location.reload();
};

function positionSettingsHint() {
    const hint = document.getElementById('settings-hint');
    const cog = document.getElementById('main-cog');
    const panel = document.getElementById('settings-panel');
    const arrow = hint ? hint.querySelector('.hint-arrow') : null;
    if (!hint || !cog) return;
    if (window.innerWidth <= 768) {
        hint.style.top = '';
        hint.style.left = '';
        hint.style.right = '16px';
        hint.style.bottom = '90px';
        return;
    }
    const cogRect = cog.getBoundingClientRect();
    const hintRect = hint.getBoundingClientRect();
    const gap = 20;
    const panelTop = panel ? parseFloat(window.getComputedStyle(panel).top) : null;
    const maxTop = Number.isFinite(panelTop) ? panelTop - 8 : window.innerHeight;
    const preferredTop = cogRect.top + (cogRect.height / 2) - (hintRect.height / 2);
    const top = Math.max(16, Math.min(preferredTop, window.innerHeight - hintRect.height - 16, maxTop));
    const left = Math.max(16, cogRect.left - hintRect.width - gap);
    if (arrow) {
        const target = cogRect.top + (cogRect.height / 2) - top - 8;
        const clamped = Math.max(14, Math.min(target, hintRect.height - 24));
        arrow.style.top = `${clamped}px`;
    }
    hint.style.top = `${top}px`;
    hint.style.left = `${left}px`;
    hint.style.right = 'auto';
    hint.style.bottom = 'auto';
}

// TTY Mode
function updateTTY(forceState = null) {
    const newState = (forceState !== null) ? forceState : !document.body.classList.contains('mode-tty');
    document.body.classList.toggle('mode-tty', newState);
    localStorage.setItem('cv-tty', newState);
    updateToggleUI('tty', newState);
}
window.toggleTTY = () => updateTTY();

document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.altKey && e.key === 't') updateTTY();
    if (e.ctrlKey && e.key === 'k') { e.preventDefault(); toggleCmd(true); }
    if (e.key === 'Escape') {
        toggleCmd(false);
        const panel = document.getElementById('settings-panel');
        if (panel && panel.classList.contains('open')) toggleSettings();
    }
    
    // Focus Trap Tab logic
    const panel = document.getElementById('settings-panel');
    if (panel && panel.classList.contains('open') && e.key === 'Tab') {
        const focusable = panel.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
            e.preventDefault(); last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault(); first.focus();
        }
    }
});

// Command Palette
const actions = [
    { id: 'theme-light', title: 'Switch to Light Theme', icon: 'sun', action: () => setTheme('light') },
    { id: 'theme-deep', title: 'Switch to Deep Theme', icon: 'moon', action: () => setTheme('deep') },
    { id: 'theme-dark', title: 'Switch to Dark Theme', icon: 'zap', action: () => setTheme('dark') },
    { id: 'lang-flip', title: 'Toggle Language', icon: 'globe', action: () => toggleLanguage() },
    { id: 'pdf', title: 'Download PDF', icon: 'download', action: () => document.querySelector('a[download]').click() },
    { id: 'tty', title: 'Toggle Matrix Mode', icon: 'terminal', action: () => updateTTY() },
    { id: 'settings', title: 'Open Settings', icon: 'settings', action: () => toggleSettings() }
];

let selectedIdx = 0;
let filteredActions = actions.slice();

function toggleCmd(show) {
    const p = document.getElementById('cmd-palette');
    const input = document.getElementById('cmd-input');
    p.classList.toggle('open', show);
    if (show) {
        input.value = '';
        renderResults('');
        setTimeout(() => input.focus(), 50);
    }
}

function renderResults(query) {
    const results = document.getElementById('cmd-results');
    const filtered = actions.filter(a => a.title.toLowerCase().includes(query.toLowerCase()));
    filteredActions = filtered;
    selectedIdx = 0;

    if (filtered.length === 0) {
        results.innerHTML = '';
        return;
    }

    results.innerHTML = filtered.map((a, i) => `
        <div class="cmd-item ${i === 0 ? 'active' : ''}" data-id="${a.id}" onclick="executeAction('${a.id}')">
            <i data-lucide="${a.icon}" class="w-4 h-4"></i><span>${a.title}</span>
        </div>`).join('');

    lucide.createIcons();
}

function executeAction(id) {
    const action = actions.find(a => a.id === id);
    if (action) { action.action(); toggleCmd(false); }
}

document.getElementById('cmd-input').addEventListener('input', (e) => renderResults(e.target.value));
document.getElementById('cmd-input').addEventListener('keydown', (e) => {
    const items = document.querySelectorAll('.cmd-item');
    if (items.length === 0) return;
    if (e.key === 'ArrowDown') {
        e.preventDefault();
        items[selectedIdx].classList.remove('active');
        selectedIdx = (selectedIdx + 1) % items.length;
        items[selectedIdx].classList.add('active');
        items[selectedIdx].scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        items[selectedIdx].classList.remove('active');
        selectedIdx = (selectedIdx - 1 + items.length) % items.length;
        items[selectedIdx].classList.add('active');
        items[selectedIdx].scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'Enter') {
        const action = filteredActions[selectedIdx];
        if (action) executeAction(action.id);
    }
});

// Spotlight & Interactions
// (Interaction logic preserved for future use)

// CROSS HIGHLIGHTING & INTERACTIONS
document.addEventListener('mouseover', e => {
    // Experience Highlight (Uniquement si on est sur un tag)
    const tag = e.target.closest('.skill-tag');
    if (tag) {
        // Allumer le point interne
        const dot = tag.querySelector('.tool-dot');
        if (dot) dot.style.opacity = '1';

        const skill = tag.getAttribute('data-skill');
        document.querySelectorAll('.exp-card').forEach(c => {
            const skillsStr = c.getAttribute('data-skills');
            if (skillsStr && skillsStr.includes(skill)) { 
                c.classList.add('highlight'); 
            } else { 
                c.classList.add('dimmed'); 
            }
        });
    }
});

document.addEventListener('mouseout', e => {
    // Nettoyage Expériences
    const tag = e.target.closest('.skill-tag');
    if (tag) {
        const dot = tag.querySelector('.tool-dot');
        if (dot) dot.style.opacity = '0.3'; // Retour à l'opacité par défaut

        document.querySelectorAll('.exp-card').forEach(c => c.classList.remove('highlight', 'dimmed'));
    }
});

// Init Settings
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM Loaded. Init settings...");
    try { lucide.createIcons(); } catch(e) { console.error("Lucide error", e); }

    const picker = document.getElementById('accent-picker');
    if (picker) {
        console.log("Picker found, generating colors...");
        colors.forEach(c => {
            const btn = document.createElement('button'); 
            btn.className = 'accent-dot'; 
            btn.style.backgroundColor = c.hex;
            btn.setAttribute('data-hex', c.hex); 
            btn.onclick = () => setAccent(c.hex); 
            picker.appendChild(btn);
        });
    } else {
        console.error("Picker NOT found!");
    }

    const savedTheme = localStorage.getItem('cv-theme') || 'deep'; 
    const savedAccent = localStorage.getItem('cv-accent') || '#3b82f6';
    const savedFontSize = localStorage.getItem('cv-font-size') || '14'; 
    const savedFontStack = localStorage.getItem('cv-font-stack') || 'architect';

    setTheme(savedTheme); 
    setAccent(savedAccent); 
    setFontSize(savedFontSize); 
    setFontStack(savedFontStack);

    const rangeInput = document.querySelector('input[type=range]');
    if (rangeInput) rangeInput.value = savedFontSize;

    if (!localStorage.getItem('cv-visited')) {
        const modal = document.getElementById('welcome-modal');
        if (modal) {
            // 1. Generate Colors in Modal
            const wPicker = document.getElementById('w-accent-picker');
            if (wPicker && colors) {
                 colors.forEach(c => {
                    const btn = document.createElement('button'); 
                    btn.className = 'w-6 h-6 rounded-full border border-white/20 hover:scale-125 transition-transform'; 
                    btn.style.backgroundColor = c.hex;
                    btn.onclick = () => { setAccent(c.hex); resetWelcomeTimer(); };
                    wPicker.appendChild(btn);
                });
            }

            // 2. Auto-detect browser lang
            const userLang = navigator.language || navigator.userLanguage; 
            const isFr = userLang.startsWith('fr');
            setWelcomeLang(isFr ? 'fr' : 'en');

            // 3. Show Modal
            setTimeout(() => {
                modal.style.opacity = '1';
                modal.style.pointerEvents = 'auto';
                
                // 4. Start auto-close timer
                const bar = document.getElementById('w-timer-bar');
                const line = document.getElementById('w-timer-bar-line');
                if (bar) {
                    bar.style.width = '0%';
                    // Force reflow
                    void bar.offsetWidth; 
                    bar.style.width = '100%';
                }
                if (line) {
                    line.style.width = '0%';
                    // Force reflow
                    void line.offsetWidth; 
                    line.style.width = '100%';
                }
                welcomeTimer = setTimeout(() => {
                    closeWelcome();
                }, WELCOME_TIMEOUT_MS);

            }, 500);
        }
    }

    if (localStorage.getItem('cv-tty') === 'true') { 
        document.body.classList.add('mode-tty');
        const cb = document.getElementById('tty-checkbox');
        if (cb) cb.checked = true;
    }
});

window.addEventListener('resize', () => {
    const hint = document.getElementById('settings-hint');
    if (hint && hint.classList.contains('show')) {
        positionSettingsHint();
    }
});

window.onclick = function(e) {
    const p = document.getElementById('settings-panel'); 
    const btn = document.querySelector('.cog-btn');
    if (p.classList.contains('open') && !p.contains(e.target) && !btn.contains(e.target)) toggleSettings();
}

// Clock
function updateClock() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' });
    const elFr = document.getElementById('local-time-fr');
    const elEn = document.getElementById('local-time-en');
    if(elFr) elFr.textContent = timeString;
    if(elEn) elEn.textContent = timeString;
}
setInterval(updateClock, 1000);
updateClock();

// Scroll Progress Bar
window.addEventListener('scroll', () => {
    const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
    const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrolled = (winScroll / height) * 100;
    const bar = document.getElementById("progress-bar");
    if (bar) bar.style.width = scrolled + "%";
});
