const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const QRCode = require('qrcode');
const { getGitHubActivity } = require('../src/utils');
const { generateHTML, generateMarkdown, generatePlain } = require('../src/templates');

const LOCAL_ENV_PATH = path.join(__dirname, '../.env');
const CONTACT_EMAIL_ENV = 'CV_CONTACT_EMAIL';
const CONTACT_PHONE_ENV = 'CV_CONTACT_PHONE';

function loadLocalEnv() {
  if (!fs.existsSync(LOCAL_ENV_PATH)) return;
  const raw = fs.readFileSync(LOCAL_ENV_PATH, 'utf8');
  raw.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) return;
    const key = trimmed.slice(0, eqIndex).trim();
    if (!key || process.env[key]) return;
    let value = trimmed.slice(eqIndex + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  });
}

function getEnvValue(key) {
  const value = process.env[key];
  return value && value.trim().length > 0 ? value.trim() : null;
}
// Load content data.
loadLocalEnv();
const data = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/data.json'), 'utf8'));
const ASSETS_DIR = path.join(__dirname, '../assets');
const OUTPUT_DIR = path.join(__dirname, '../dist');
const REQUIRED_ASSETS = ['tailwind.js', 'lucide.js'];
const PDF_THEMES = ['light', 'deep', 'dark'];
const PDF_FONT_STACKS = ['hub', 'geist', 'space', 'archivo', 'quantum', 'console', 'architect', 'oxy'];

function failValidation(message) {
  throw new Error(`Invalid data/data.json: ${message}`);
}

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function requireObject(value, pathLabel) {
  if (!isObject(value)) failValidation(`${pathLabel} must be an object`);
}

function requireArray(value, pathLabel) {
  if (!Array.isArray(value)) failValidation(`${pathLabel} must be an array`);
}

function requireString(value, pathLabel) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    failValidation(`${pathLabel} must be a non-empty string`);
  }
}

function requireLangObject(value, pathLabel) {
  requireObject(value, pathLabel);
  requireString(value.fr, `${pathLabel}.fr`);
  requireString(value.en, `${pathLabel}.en`);
}

function requireSummaryItems(items, pathLabel) {
  requireArray(items, pathLabel);
  items.forEach((item, index) => {
    const itemPath = `${pathLabel}[${index}]`;
    requireObject(item, itemPath);
    requireString(item.title, `${itemPath}.title`);
    requireString(item.text, `${itemPath}.text`);
    requireString(item.icon, `${itemPath}.icon`);
  });
}

function validateData(payload) {
  requireObject(payload, 'root');
  requireObject(payload.contact, 'contact');
  requireString(payload.contact.name, 'contact.name');
  requireLangObject(payload.contact.title, 'contact.title');
  requireString(payload.contact.location, 'contact.location');
  requireString(payload.contact.email, 'contact.email');
  requireString(payload.contact.birthDate, 'contact.birthDate');
  requireString(payload.contact.website, 'contact.website');
  requireString(payload.contact.github, 'contact.github');
  requireString(payload.contact.linkedin, 'contact.linkedin');

  requireObject(payload.summary, 'summary');
  requireSummaryItems(payload.summary.fr, 'summary.fr');
  requireSummaryItems(payload.summary.en, 'summary.en');

  requireArray(payload.experiences, 'experiences');
  payload.experiences.forEach((exp, expIndex) => {
    const expPath = `experiences[${expIndex}]`;
    requireObject(exp, expPath);
    requireString(exp.company, `${expPath}.company`);
    requireString(exp.period, `${expPath}.period`);
    requireLangObject(exp.role, `${expPath}.role`);
    requireLangObject(exp.summary, `${expPath}.summary`);
    requireArray(exp.domains, `${expPath}.domains`);
    exp.domains.forEach((domain, domainIndex) => {
      const domPath = `${expPath}.domains[${domainIndex}]`;
      requireObject(domain, domPath);
      requireString(domain.title, `${domPath}.title`);
      requireObject(domain.items, `${domPath}.items`);
      requireArray(domain.items.fr, `${domPath}.items.fr`);
      requireArray(domain.items.en, `${domPath}.items.en`);
    });
  });

  requireArray(payload.education, 'education');
  payload.education.forEach((edu, eduIndex) => {
    const eduPath = `education[${eduIndex}]`;
    requireObject(edu, eduPath);
    requireLangObject(edu.degree, `${eduPath}.degree`);
    requireString(edu.school, `${eduPath}.school`);
    requireString(edu.year, `${eduPath}.year`);
  });

  requireArray(payload.certifications, 'certifications');
  payload.certifications.forEach((cert, certIndex) => {
    const certPath = `certifications[${certIndex}]`;
    requireObject(cert, certPath);
    requireString(cert.name, `${certPath}.name`);
    requireString(cert.issuer, `${certPath}.issuer`);
    requireString(cert.year, `${certPath}.year`);
    requireString(cert.icon, `${certPath}.icon`);
  });

  requireArray(payload.projects, 'projects');
  payload.projects.forEach((proj, projIndex) => {
    const projPath = `projects[${projIndex}]`;
    requireObject(proj, projPath);
    requireString(proj.name, `${projPath}.name`);
    requireLangObject(proj.description, `${projPath}.description`);
    requireString(proj.github, `${projPath}.github`);
    requireArray(proj.tools, `${projPath}.tools`);
    requireString(proj.icon, `${projPath}.icon`);
  });

  requireObject(payload.languages, 'languages');
  requireArray(payload.languages.fr, 'languages.fr');
  requireArray(payload.languages.en, 'languages.en');

  requireObject(payload.skills, 'skills');
  requireArray(payload.skills.professional, 'skills.professional');
  payload.skills.professional.forEach((skill, skillIndex) => {
    const skillPath = `skills.professional[${skillIndex}]`;
    requireObject(skill, skillPath);
    requireString(skill.category, `${skillPath}.category`);
    requireString(skill.description, `${skillPath}.description`);
    if (Array.isArray(skill.tools)) {
      requireArray(skill.tools, `${skillPath}.tools`);
      skill.tools.forEach((tool, toolIndex) => {
        requireString(tool, `${skillPath}.tools[${toolIndex}]`);
      });
    } else {
      requireString(skill.tools, `${skillPath}.tools`);
    }
    requireString(skill.icon, `${skillPath}.icon`);
  });

  requireObject(payload.skills.personal, 'skills.personal');
  requireArray(payload.skills.personal.fr, 'skills.personal.fr');
  requireArray(payload.skills.personal.en, 'skills.personal.en');
}

function assertOfflineAssets() {
  const missing = REQUIRED_ASSETS.filter((asset) => !fs.existsSync(path.join(ASSETS_DIR, asset)));
  if (missing.length > 0) {
    throw new Error(
      `Missing offline assets: ${missing.join(', ')}. ` +
      'Run "node build/download-assets.js" with network access before building.'
    );
  }
}

function syncAssetsToBuild() {
  const targetDir = path.join(OUTPUT_DIR, 'assets');
  fs.rmSync(targetDir, { recursive: true, force: true });
  // Do not create the targetDir here, let cpSync create it as a copy of ASSETS_DIR
  fs.cpSync(ASSETS_DIR, targetDir, { recursive: true });
}

function writeRobotsAndHeaders() {
  const robotsTxt = [
    'User-agent: *',
    'Disallow: /*.pdf$',
    'Disallow: /*.PDF$',
    'Disallow: /*.md$',
    'Disallow: /*.MD$',
    'Disallow: /*.txt$',
    'Disallow: /*.TXT$'
  ].join('\n');
  fs.writeFileSync(path.join(OUTPUT_DIR, 'robots.txt'), robotsTxt);

  const htaccess = [
    '<IfModule mod_headers.c>',
    '  <FilesMatch "\\\\.(pdf|md|txt)$">',
    '    Header set X-Robots-Tag "noindex, nofollow"',
    '  </FilesMatch>',
    '</IfModule>'
  ].join('\n');
  fs.writeFileSync(path.join(OUTPUT_DIR, '.htaccess'), htaccess);
}

function applyContactOverrides(payload) {
  const emailEnv = getEnvValue(CONTACT_EMAIL_ENV);
  if (emailEnv) {
    payload.contact.email = emailEnv;
  }
  const phoneEnv = getEnvValue(CONTACT_PHONE_ENV);
  if (phoneEnv) {
    payload.contact.phone = phoneEnv;
  }
}

function assertContactValue(value, label, envKey) {
  if (!value || value.trim().length === 0) {
    throw new Error(`Missing ${label}. Set ${envKey} in .env or GitHub Secrets.`);
  }
}

function parseNumber(value) {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeHex(value) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed.startsWith('#')) return null;
  if (trimmed.length === 4) {
    return `#${trimmed[1]}${trimmed[1]}${trimmed[2]}${trimmed[2]}${trimmed[3]}${trimmed[3]}`.toLowerCase();
  }
  if (trimmed.length === 7) {
    return trimmed.toLowerCase();
  }
  return null;
}

function validateRgb(value, label) {
  if (typeof value !== 'string') {
    throw new Error(`${label} must be an RGB string like "59, 130, 246".`);
  }
  const match = value.match(/^\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*$/);
  if (!match) {
    throw new Error(`${label} must be an RGB string like "59, 130, 246".`);
  }
  const parts = match.slice(1).map((part) => Number(part));
  if (parts.some((part) => part < 0 || part > 255)) {
    throw new Error(`${label} values must be in the 0-255 range.`);
  }
  return parts.join(', ');
}

function getPdfAppearance() {
  const theme = process.env.PDF_THEME ? process.env.PDF_THEME.trim() : null;
  if (theme && !PDF_THEMES.includes(theme)) {
    throw new Error(`PDF_THEME must be one of: ${PDF_THEMES.join(', ')}.`);
  }

  const accent = process.env.PDF_ACCENT ? normalizeHex(process.env.PDF_ACCENT) : null;
  if (process.env.PDF_ACCENT && !accent) {
    throw new Error('PDF_ACCENT must be a hex color like "#3b82f6".');
  }

  const accentRgba = process.env.PDF_ACCENT_RGBA
    ? validateRgb(process.env.PDF_ACCENT_RGBA, 'PDF_ACCENT_RGBA')
    : null;

  const fontSize = parseNumber(process.env.PDF_FONT_SIZE);
  if (process.env.PDF_FONT_SIZE && fontSize === null) {
    throw new Error('PDF_FONT_SIZE must be a valid number.');
  }
  if (fontSize !== null && (fontSize < 12 || fontSize > 20)) {
    throw new Error('PDF_FONT_SIZE must be between 12 and 20.');
  }

  const fontStack = process.env.PDF_FONT_STACK ? process.env.PDF_FONT_STACK.trim() : null;
  if (fontStack && !PDF_FONT_STACKS.includes(fontStack)) {
    throw new Error(`PDF_FONT_STACK must be one of: ${PDF_FONT_STACKS.join(', ')}.`);
  }

  return {
    theme,
    accent,
    accentRgba,
    fontSize,
    fontStack
  };
}

const VALIDATE_ONLY = process.argv.includes('--validate-only');
const formatBuildStamp = (date) => date.toISOString().replace('T', ' ').replace('Z', ' UTC');
const logStep = (emoji, message) => console.log(`${emoji} ${message}`);
const logSubStep = (message) => console.log(`   ↳ ${message}`);

// --- MAIN BUILD PROCESS ---
async function build() {
  const buildStartedAt = new Date();
  logStep('🛠️', `Build started — ${formatBuildStamp(buildStartedAt)}`);
  applyContactOverrides(data);
  assertContactValue(data.contact.email, 'contact.email', CONTACT_EMAIL_ENV);
  assertContactValue(data.contact.phone, 'contact.phone', CONTACT_PHONE_ENV);
  validateData(data);
  if (VALIDATE_ONLY) {
    logStep('✅', 'Validation OK — data/data.json structure is valid.');
    return;
  }
  assertOfflineAssets();
  fs.rmSync(OUTPUT_DIR, { recursive: true, force: true });
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  syncAssetsToBuild();
  writeRobotsAndHeaders();
  const browser = await chromium.launch();
  const activity = await getGitHubActivity(data.contact.github);
  const clientScript = fs.readFileSync(path.join(__dirname, '../src/scripts/client.js'), 'utf8');
  const pdfAppearance = getPdfAppearance();
  
  // 1) Generate interactive index (default FR).
  logStep('🧩', 'Generating interactive index (index.html)...');
  const qrDefault = await QRCode.toDataURL('https://tomzone.fr', { margin: 1, width: 100, color: { dark: '#000000', light: '#ffffff' } });
  const htmlInteractive = generateHTML(data, 'fr', activity, qrDefault, 'interactive', clientScript);
  fs.writeFileSync(path.join(OUTPUT_DIR, "index.html"), htmlInteractive);

  // 2) Generate PDF-specific files (FR/EN).
  const themes = pdfAppearance.theme ? [pdfAppearance.theme] : PDF_THEMES;
  
  for (const lang of ['fr', 'en']) {
    logStep('📦', `Generating assets for ${lang.toUpperCase()}...`);
    
    // Generate QR code.
    logSubStep('Generate QR code');
    const qrTarget = lang === 'fr' ? 'https://tomzone.fr/index_fr.html' : 'https://tomzone.fr/index_en.html';
    const qrDataURI = await QRCode.toDataURL(qrTarget, { margin: 1, width: 100, color: { dark: '#000000', light: '#ffffff' } });

    // Generate dedicated language HTML file (referenced in SEO/QR)
    logSubStep('Generate HTML');
    const htmlLang = generateHTML(data, lang, activity, qrDataURI, 'interactive', clientScript);
    fs.writeFileSync(path.join(OUTPUT_DIR, `index_${lang}.html`), htmlLang);

    // Generate PDFs for each theme.
    for (const theme of themes) {
        logSubStep(`Generate PDF (${theme})`);
        const htmlContent = generateHTML(data, lang, activity, qrDataURI, 'pdf', '', {
          theme: theme,
          fontSize: pdfAppearance.fontSize || 18,
          fontStack: pdfAppearance.fontStack || 'hub',
          accent: pdfAppearance.accent || null,
          accentRgba: pdfAppearance.accentRgba || null
        });
        // Write a temporary HTML file for Playwright.
        const tempHtmlPath = path.join(OUTPUT_DIR, `temp_${lang}_${theme}.html`);
        fs.writeFileSync(tempHtmlPath, htmlContent);

        const page = await browser.newPage();
        await page.emulateMedia({ media: 'screen' });
        await page.setViewportSize({ width: 1400, height: 1200 });
        
        await page.goto(`file://${tempHtmlPath}`, { waitUntil: 'networkidle' });
        
        // Ensure avatar is loaded
        await page.waitForFunction(() => {
          const img = document.querySelector('img[alt="Thomas Bourcey"]');
          if (!img) return false;
          return img.complete && img.naturalHeight !== 0;
        }, { timeout: 5000 }).catch(async () => {
          const imgExists = await page.evaluate(() => {
            const img = document.querySelector('img[alt="Thomas Bourcey"]');
            return img ? { src: img.src, visible: img.offsetParent !== null, complete: img.complete, naturalHeight: img.naturalHeight } : null;
          });
          console.warn("⚠️ Avatar image issue:", imgExists);
        });

        await page.waitForTimeout(500); 
        
        // Default file is Light: CV_Thomas_Bourcey_FR.pdf, Resume_Thomas_Bourcey_EN.pdf.
        
        let pdfName = "";
        if (lang === 'fr') {
            pdfName = theme === 'light' ? "CV_Thomas_Bourcey_FR.pdf" : `CV_Thomas_Bourcey_FR_${theme.charAt(0).toUpperCase() + theme.slice(1)}.pdf`;
        } else {
            pdfName = theme === 'light' ? "Resume_Thomas_Bourcey_EN.pdf" : `Resume_Thomas_Bourcey_EN_${theme.charAt(0).toUpperCase() + theme.slice(1)}.pdf`;
        }

        await page.pdf({
          path: path.join(OUTPUT_DIR, pdfName),
          format: 'A4',
          printBackground: true,
          preferCSSPageSize: true,
          scale: 0.55,
          margin: { top: '0px', right: '0px', bottom: '0px', left: '0px' },
          displayHeaderFooter: false
        });
        if (theme === 'deep') {
          logStep('🖼️', 'Preview PNG...');
          await page.setViewportSize({ width: 1200, height: 630 });
          // Final check for animations or fonts
          await page.waitForTimeout(2000);
          await page.screenshot({ path: path.join(OUTPUT_DIR, `preview_${lang}.png`) });
        }

        await page.close();
        fs.unlinkSync(tempHtmlPath);
    }

    // Markdown & TXT (once per language).
    const mdContent = generateMarkdown(data, lang);
    const mdFileName = lang === 'fr' ? "CV_FR.md" : "Resume_EN.md";
    fs.writeFileSync(path.join(OUTPUT_DIR, mdFileName), mdContent);
    
    const txtContent = generatePlain(data, lang);
    const txtFileName = lang === 'fr' ? "CV_Thomas_Bourcey_FR.txt" : "Resume_Thomas_Bourcey_EN.txt";
    fs.writeFileSync(path.join(OUTPUT_DIR, txtFileName), txtContent);
  }
  await browser.close();
}

build().catch(err => {
  console.error('Build failed:', err);
  process.exit(1);
});
