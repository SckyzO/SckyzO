const colors = [ { name: 'Blue', value: '59, 130, 246', hex: '#3b82f6' }, { name: 'Emerald', value: '16, 185, 129', hex: '#10b981' }, { name: 'Violet', value: '139, 92, 246', hex: '#8b5cf6' }, { name: 'Amber', value: '245, 158, 11', hex: '#f5a623' }, { name: 'Rose', value: '244, 63, 94', hex: '#f43f5e' }, { name: 'Sky', value: '14, 165, 233', hex: '#0ea5e9' }, { name: 'Orange', value: '249, 115, 22', hex: '#f97316' }, { name: 'Teal', value: '20, 184, 166', hex: '#14b8a6' }, { name: 'Cyan', value: '6, 182, 212', hex: '#06b6d4' }, { name: 'Fuchsia', value: '217, 70, 239', hex: '#d946ef' } ];

// Initialisation immédiate des icônes
try { lucide.createIcons(); } catch(e) { console.error("Lucide init failed", e); }

function toggleSettings() {
    document.getElementById('settings-panel').classList.toggle('open');
}

function updateToggleUI(type, state) {
    const activeClass = "flex-1 py-2 rounded-lg text-[10px] font-bold uppercase transition-all bg-white text-black shadow-lg flex items-center justify-center gap-2 cursor-default";
    const inactiveClass = "flex-1 py-2 rounded-lg text-[10px] font-bold uppercase transition-all opacity-50 hover:opacity-100 flex items-center justify-center gap-2 cursor-pointer";

    if (type === 'lang') {
        const btnFr = document.getElementById('btn-lang-fr');
        const btnEn = document.getElementById('btn-lang-en');
        if (btnFr && btnEn) {
            const isFrActive = btnFr.classList.contains('bg-white');
            if (isFrActive) {
                btnFr.className = inactiveClass;
                btnEn.className = activeClass;
            } else {
                btnFr.className = activeClass;
                btnEn.className = inactiveClass;
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
    document.documentElement.style.setProperty('--accent', hex);
    document.documentElement.style.setProperty('--accent-rgba', color.value);
    localStorage.setItem('cv-accent', hex);
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
    if (e.key === 'Escape') toggleCmd(false);
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
    selectedIdx = 0;

    // Utilisation de backticks normaux car nous sommes dans un fichier JS pur
    results.innerHTML = filtered.map((a, i) => `
        <div class="cmd-item ${i === 0 ? 'active' : ''}" onclick="executeAction('${a.id}')">
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
        const active = document.querySelector('.cmd-item.active');
        if (active) executeAction(active.getAttribute('data-id'));
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
    const savedFontStack = localStorage.getItem('cv-font-stack') || 'hub';

    setTheme(savedTheme); 
    setAccent(savedAccent); 
    setFontSize(savedFontSize); 
    setFontStack(savedFontStack);

    const rangeInput = document.querySelector('input[type=range]');
    if (rangeInput) rangeInput.value = savedFontSize;

    if (!localStorage.getItem('cv-visited')) {
        const tip = document.getElementById('onboarding-tip'); 
        const cog = document.getElementById('main-cog');
        if (tip && cog) {
            setTimeout(() => { tip.classList.add('show'); cog.classList.add('aura-pulse'); }, 1000);
            setTimeout(() => { tip.classList.remove('show'); cog.classList.remove('aura-pulse'); localStorage.setItem('cv-visited', 'true'); }, 10000);
        }
    }

    if (localStorage.getItem('cv-tty') === 'true') { 
        document.body.classList.add('mode-tty');
        const cb = document.getElementById('tty-checkbox');
        if (cb) cb.checked = true;
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
