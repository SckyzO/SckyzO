const colors = [ { name: 'Blue', value: '59, 130, 246', hex: '#3b82f6' }, { name: 'Emerald', value: '16, 185, 129', hex: '#10b981' }, { name: 'Violet', value: '139, 92, 246', hex: '#8b5cf6' }, { name: 'Amber', value: '245, 158, 11', hex: '#f5a623' }, { name: 'Rose', value: '244, 63, 94', hex: '#f43f5e' }, { name: 'Sky', value: '14, 165, 233', hex: '#0ea5e9' }, { name: 'Orange', value: '249, 115, 22', hex: '#f97316' }, { name: 'Teal', value: '20, 184, 166', hex: '#14b8a6' }, { name: 'Cyan', value: '6, 182, 212', hex: '#06b6d4' }, { name: 'Fuchsia', value: '217, 70, 239', hex: '#d946ef' } ];

lucide.createIcons();

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
            // state true = EN, false = FR (par convention ici)
            // Mais attention, toggleLanguage inverse juste.
            // On va se baser sur la classe actuelle pour inverser.
            const isFrActive = btnFr.classList.contains('bg-white');
            if (isFrActive) {
                // Passage à EN
                btnFr.className = inactiveClass;
                btnEn.className = activeClass;
            } else {
                // Passage à FR
                btnFr.className = activeClass;
                btnEn.className = inactiveClass;
            }
        }
    } else if (type === 'tty') {
        const btnStd = document.getElementById('btn-std');
        const btnMatrix = document.getElementById('btn-matrix');
        if (btnStd && btnMatrix) {
            if (state) { // Matrix Active
                btnMatrix.className = activeClass;
                btnStd.className = inactiveClass;
            } else { // Standard Active
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

// Command Palette & Interactions
const actions = [
    { id: 'theme-light', title: 'Switch to Light Theme', icon: 'sun', action: () => setTheme('light') },
    { id: 'theme-dark', title: 'Switch to Dark Theme', icon: 'zap', action: () => setTheme('dark') },
    { id: 'lang-flip', title: 'Toggle Language', icon: 'globe', action: () => toggleLanguage() },
    { id: 'pdf', title: 'Download PDF', icon: 'download', action: () => document.querySelector('a[download]').click() },
    { id: 'tty', title: 'Toggle Matrix Mode', icon: 'terminal', action: () => updateTTY() },
    { id: 'settings', title: 'Open Settings', icon: 'settings', action: () => toggleSettings() }
];

function toggleCmd(show) {
    const p = document.getElementById('cmd-palette');
    const input = document.getElementById('cmd-input');
    p.classList.toggle('open', show);
    if (show) { input.value = ''; renderResults(''); setTimeout(() => input.focus(), 50); }
}

function renderResults(query) {
    const results = document.getElementById('cmd-results');
    const filtered = actions.filter(a => a.title.toLowerCase().includes(query.toLowerCase()));
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

// Init
const savedTheme = localStorage.getItem('cv-theme') || 'deep'; 
const savedAccent = localStorage.getItem('cv-accent') || '#3b82f6';
const savedFontSize = localStorage.getItem('cv-font-size') || '14'; 
const savedFontStack = localStorage.getItem('cv-font-stack') || 'hub';

setTheme(savedTheme); setAccent(savedAccent); setFontSize(savedFontSize); setFontStack(savedFontStack);
document.querySelector('input[type=range]').value = savedFontSize;

if (localStorage.getItem('cv-tty') === 'true') updateTTY(true);
else updateTTY(false);

window.onclick = function(e) {
    const p = document.getElementById('settings-panel'); 
    const btn = document.querySelector('.cog-btn');
    if (p.classList.contains('open') && !p.contains(e.target) && !btn.contains(e.target)) toggleSettings();
}