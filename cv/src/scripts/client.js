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

let lastSettingsTrigger = null;
function toggleSettings(event) {
    if (event && typeof event.stopPropagation === 'function') event.stopPropagation();
    const panel = document.getElementById('settings-panel');
    const triggers = document.querySelectorAll('.settings-trigger');
    if (event && event.currentTarget) {
        lastSettingsTrigger = event.currentTarget;
    }
    const isOpen = panel.classList.toggle('open');
    
    // Accessibility & Scroll Lock
    if (isOpen) {
        document.body.style.overflow = 'hidden'; // Lock scroll
        triggers.forEach((trigger) => trigger.setAttribute('aria-expanded', 'true'));
        
        // Focus Trap simple
        const focusableElements = panel.querySelectorAll('button, input, [href], select, textarea, [tabindex]:not([tabindex="-1"])');
        if (focusableElements.length) focusableElements[0].focus();
    } else {
        document.body.style.overflow = ''; // Unlock scroll
        triggers.forEach((trigger) => trigger.setAttribute('aria-expanded', 'false'));
        if (lastSettingsTrigger) lastSettingsTrigger.focus();
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
            btnStd.classList.toggle('active', !state);
            btnMatrix.classList.toggle('active', state);
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
    const buttons = [
        { id: 'btn-light', theme: 'light' },
        { id: 'btn-deep', theme: 'deep' },
        { id: 'btn-dark', theme: 'dark' }
    ];
    buttons.forEach(({ id, theme }) => {
        const btn = document.getElementById(id);
        if (!btn) return;
        btn.classList.toggle('active', theme === t);
    });
}

function setAccent(hex) {
    const color = colors.find(c => c.hex === hex);
    const accentHex = color ? color.hex : defaultAccent;
    const accentRgba = color ? color.value : defaultAccentRgba;
    document.documentElement.style.setProperty('--accent', accentHex);
    document.documentElement.style.setProperty('--accent-rgba', accentRgba);
    localStorage.setItem('cv-accent', accentHex);
    document.querySelectorAll('.accent-dot').forEach((btn) => {
        btn.classList.toggle('active', btn.getAttribute('data-hex') === accentHex);
    });
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
    document.querySelectorAll('.font-btn').forEach((btn) => {
        btn.classList.toggle('active', btn.id === `f-${f}`);
    });
}

function decodeContactValue(encoded) {
    if (!encoded) return '';
    try {
        return atob(encoded.split('').reverse().join(''));
    } catch (error) {
        return '';
    }
}

function sanitizePhone(value) {
    return value.replace(/[^+\d]/g, '');
}

function copyToClipboard(value) {
    if (navigator.clipboard && window.isSecureContext) {
        return navigator.clipboard.writeText(value);
    }
    const temp = document.createElement('textarea');
    temp.value = value;
    temp.setAttribute('readonly', '');
    temp.style.position = 'absolute';
    temp.style.left = '-9999px';
    document.body.appendChild(temp);
    temp.select();
    document.execCommand('copy');
    document.body.removeChild(temp);
    return Promise.resolve();
}

function setupContactSecurity() {
    const items = document.querySelectorAll('[data-contact-encoded]');
    items.forEach((item) => {
        const encoded = item.dataset.contactEncoded;
        const type = item.dataset.contactType;
        const labelReveal = item.dataset.labelReveal || 'Reveal';
        const labelCopy = item.dataset.labelCopy || 'Copy';
        const labelCopied = item.dataset.labelCopied || 'Copied';
        const link = item.querySelector('.contact-link');
        const valueEl = item.querySelector('.contact-value');
        const revealBtn = item.querySelector('[data-contact-action="reveal"]');
        const copyBtn = item.querySelector('[data-contact-action="copy"]');
        if (!link || !valueEl) return;

        const revealValue = () => {
            if (item.dataset.revealed === 'true') return '';
            const value = decodeContactValue(encoded);
            if (!value) return '';
            valueEl.textContent = value;
            item.dataset.revealed = 'true';
            link.classList.add('is-revealed');
            if (type === 'email') {
                link.href = `mailto:${value}`;
            } else {
                link.href = `tel:${sanitizePhone(value)}`;
            }
            if (revealBtn) revealBtn.disabled = true;
            if (copyBtn) copyBtn.disabled = false;
            return value;
        };

        if (revealBtn) {
            revealBtn.addEventListener('click', (event) => {
                event.preventDefault();
                revealValue();
            });
        }

        if (link) {
            link.addEventListener('click', (event) => {
                if (item.dataset.revealed === 'true') return;
                event.preventDefault();
                revealValue();
            });
        }

        if (copyBtn) {
            copyBtn.addEventListener('click', (event) => {
                event.preventDefault();
                const value = item.dataset.revealed === 'true' ? valueEl.textContent : decodeContactValue(encoded);
                if (!value) return;
                copyToClipboard(value).then(() => {
                    copyBtn.dataset.state = 'copied';
                    copyBtn.setAttribute('title', labelCopied);
                    copyBtn.setAttribute('aria-label', labelCopied);
                    copyBtn.disabled = true;
                    setTimeout(() => {
                        copyBtn.dataset.state = 'ready';
                        copyBtn.setAttribute('title', labelCopy);
                        copyBtn.setAttribute('aria-label', labelCopy);
                        copyBtn.disabled = false;
                        if (item.dataset.revealed !== 'true') {
                            copyBtn.disabled = true;
                            if (revealBtn) {
                                revealBtn.disabled = false;
                                revealBtn.setAttribute('title', labelReveal);
                                revealBtn.setAttribute('aria-label', labelReveal);
                            }
                        }
                    }, 1500);
                });
            });
        }
    });
}

function setContrast(enabled) {
    const b = document.getElementById('body-root');
    b.classList.toggle('contrast-high', enabled);
    localStorage.setItem('cv-contrast', enabled ? 'true' : 'false');
    const toggle = document.getElementById('toggle-contrast');
    if (toggle) toggle.checked = enabled;
}

// Welcome Modal Logic
let welcomeTimer = null;
const WELCOME_TIMEOUT_MS = 15000;
const SETTINGS_HINT_TIMEOUT_MS = 15000;

function getActiveSettingsTrigger() {
    const triggers = Array.from(document.querySelectorAll('.settings-trigger'));
    return triggers.find((trigger) => trigger.offsetParent !== null) || triggers[0] || null;
}

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
    const trigger = getActiveSettingsTrigger();
    if (trigger) {
        trigger.classList.add('aura-pulse');
        setTimeout(() => trigger.classList.remove('aura-pulse'), 2000);
    }
};

function showSettingsHint() {
    const hint = document.getElementById('settings-hint');
    if (!hint) return;
    if (localStorage.getItem('cv-settings-hint') === 'true') return;
    hint.classList.add('show');
    positionSettingsHint();
    requestAnimationFrame(() => positionSettingsHint());
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
    localStorage.removeItem('cv-contrast');
    window.location.reload();
};

function positionSettingsHint() {
    const hint = document.getElementById('settings-hint');
    const cog = getActiveSettingsTrigger();
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
    const hintWidth = hintRect.width || hint.offsetWidth;
    const hintHeight = hintRect.height || hint.offsetHeight;
    const gap = 20;
    const panelTop = panel ? parseFloat(window.getComputedStyle(panel).top) : null;
    const maxTop = Number.isFinite(panelTop) ? panelTop - 8 : window.innerHeight;
    const preferredTop = cogRect.top + (cogRect.height / 2) - (hintHeight / 2);
    const top = Math.max(16, Math.min(preferredTop, window.innerHeight - hintHeight - 16, maxTop));
    const left = Math.min(window.innerWidth - hintWidth - 16, cogRect.right + gap);
    if (arrow) {
        const target = cogRect.top + (cogRect.height / 2) - top - 8;
        const clamped = Math.max(14, Math.min(target, hintHeight - 24));
        arrow.style.top = `${clamped}px`;
    }
    hint.style.top = `${top}px`;
    hint.style.left = `${left}px`;
    hint.style.right = 'auto';
    hint.style.bottom = 'auto';
}

let matrixInterval = null;
let matrixResizeHandler = null;
let matrixCanvas = null;
let matrixContext = null;
let matrixDrops = [];
const matrixAlphabet = 'アァカサタナハマヤャラワガザダバパイィキシチニヒミリヰギジヂビピウゥクスツヌフムユュルグズブヅプエェケセテネヘメレヱゲゼデベペオォコソトノホモヨョロヲゴゾドボポヴッンABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const matrixFontSize = 16;

function resizeMatrixCanvas() {
    if (!matrixCanvas) return;
    matrixCanvas.width = window.innerWidth;
    matrixCanvas.height = window.innerHeight;
    const columns = Math.floor(matrixCanvas.width / matrixFontSize);
    matrixDrops = Array(columns).fill(1);
}

function startMatrixBackground() {
    if (matrixInterval) return;
    matrixCanvas = document.getElementById('matrix-canvas');
    if (!matrixCanvas) return;
    matrixContext = matrixCanvas.getContext('2d');
    if (!matrixContext) return;
    resizeMatrixCanvas();
    matrixResizeHandler = () => resizeMatrixCanvas();
    window.addEventListener('resize', matrixResizeHandler);
    matrixInterval = setInterval(() => {
        if (!matrixContext || !matrixCanvas) return;
        matrixContext.fillStyle = 'rgba(0, 0, 0, 0.08)';
        matrixContext.fillRect(0, 0, matrixCanvas.width, matrixCanvas.height);
        matrixContext.fillStyle = 'rgba(15, 255, 0, 0.5)';
        matrixContext.font = `${matrixFontSize}px monospace`;
        for (let i = 0; i < matrixDrops.length; i++) {
            const text = matrixAlphabet.charAt(Math.floor(Math.random() * matrixAlphabet.length));
            matrixContext.fillText(text, i * matrixFontSize, matrixDrops[i] * matrixFontSize);
            if (matrixDrops[i] * matrixFontSize > matrixCanvas.height && Math.random() > 0.975) {
                matrixDrops[i] = 0;
            }
            matrixDrops[i]++;
        }
    }, 45);
}

function stopMatrixBackground() {
    if (matrixInterval) {
        clearInterval(matrixInterval);
        matrixInterval = null;
    }
    if (matrixResizeHandler) {
        window.removeEventListener('resize', matrixResizeHandler);
        matrixResizeHandler = null;
    }
    if (matrixContext && matrixCanvas) {
        matrixContext.clearRect(0, 0, matrixCanvas.width, matrixCanvas.height);
    }
}

// TTY Mode
function updateTTY(forceState = null) {
    const newState = (forceState !== null) ? forceState : !document.body.classList.contains('mode-tty');
    document.body.classList.toggle('mode-tty', newState);
    localStorage.setItem('cv-tty', newState);
    updateToggleUI('tty', newState);
    if (newState) {
        startMatrixBackground();
    } else {
        stopMatrixBackground();
    }
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

document.addEventListener('mouseover', e => {
    const card = e.target.closest('.skill-card');
    if (!card) return;
    const category = card.getAttribute('data-category');
    if (!category) return;
    document.querySelectorAll('.radar-point').forEach(point => {
        point.classList.toggle('active', point.getAttribute('data-category') === category);
    });
});

document.addEventListener('mouseout', e => {
    const card = e.target.closest('.skill-card');
    if (!card) return;
    const related = e.relatedTarget;
    if (related && related.closest && related.closest('.skill-card') === card) return;
    document.querySelectorAll('.radar-point').forEach(point => point.classList.remove('active'));
});

document.addEventListener('click', (e) => {
    const toggle = e.target.closest('[data-skill-toggle]');
    if (!toggle) return;
    const card = toggle.closest('.skill-card');
    if (!card) return;
    const isOpen = card.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    const count = toggle.getAttribute('data-count');
    if (count) {
        toggle.textContent = isOpen ? '–' : `+${count}`;
    }
});

// Init Settings
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM Loaded. Init settings...");
    try { lucide.createIcons(); } catch(e) { console.error("Lucide error", e); }
    setupContactSecurity();

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
    const savedFontSize = localStorage.getItem('cv-font-size') || '15'; 
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

    const isTty = localStorage.getItem('cv-tty') === 'true';
    if (isTty) {
        document.body.classList.add('mode-tty');
        const cb = document.getElementById('tty-checkbox');
        if (cb) cb.checked = true;
    }
    updateToggleUI('tty', isTty);
    if (isTty) {
        startMatrixBackground();
    } else {
        stopMatrixBackground();
    }

    const isContrast = localStorage.getItem('cv-contrast') === 'true';
    setContrast(isContrast);

    const trigger = getActiveSettingsTrigger();
    if (trigger) {
        trigger.classList.add('settings-pulse');
        setTimeout(() => trigger.classList.remove('settings-pulse'), 10000);
    }
});

window.addEventListener('resize', () => {
    const hint = document.getElementById('settings-hint');
    if (hint && hint.classList.contains('show')) {
        positionSettingsHint();
    }
});

window.onclick = function(e) {
    const panel = document.getElementById('settings-panel');
    const triggers = document.querySelectorAll('.settings-trigger');
    const clickedTrigger = Array.from(triggers).some((trigger) => trigger.contains(e.target));
    if (panel.classList.contains('open') && !panel.contains(e.target) && !clickedTrigger) toggleSettings();
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
