const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const QRCode = require('qrcode');
const { getGitHubActivity } = require('./src/utils');
const { generateHTML, generateMarkdown, generatePlain } = require('./src/templates');

// Load content data.
const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'data.json'), 'utf8'));
const ASSETS_DIR = path.join(__dirname, 'assets');
const REQUIRED_ASSETS = ['tailwind.js', 'lucide.js'];

function failValidation(message) {
  throw new Error(`Invalid data.json: ${message}`);
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

  requireLangObject(payload.summary, 'summary');

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
    requireString(skill.tools, `${skillPath}.tools`);
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
      'Run "node download-assets.js" with network access before building.'
    );
  }
}

// --- MAIN BUILD PROCESS ---
async function build() {
  validateData(data);
  assertOfflineAssets();
  const browser = await chromium.launch();
  const activity = await getGitHubActivity(data.contact.github);
  const clientScript = fs.readFileSync(path.join(__dirname, 'client.js'), 'utf8');
  
  // 1) Generate interactive index (default FR).
  console.log("Generating interactive index (index.html)...");
  const qrDefault = await QRCode.toDataURL('https://tomzone.fr', { margin: 1, width: 100, color: { dark: '#000000', light: '#ffffff' } });
  const htmlInteractive = generateHTML(data, 'fr', activity, qrDefault, 'interactive', clientScript);
  fs.writeFileSync(path.join(__dirname, "index.html"), htmlInteractive);

  // 2) Generate PDF-specific files (FR/EN).
  const themes = ['light', 'deep', 'dark'];
  
  for (const lang of ['fr', 'en']) {
    console.log("Generating assets for " + lang.toUpperCase() + "...");
    
    // Generate QR code.
    const qrTarget = lang === 'fr' ? 'https://tomzone.fr/index_fr.html' : 'https://tomzone.fr/index_en.html';
    const qrDataURI = await QRCode.toDataURL(qrTarget, { margin: 1, width: 100, color: { dark: '#000000', light: '#ffffff' } });

    // Generate PDFs for each theme.
    for (const theme of themes) {
        console.log(`  - PDF ${theme}...`);
        // Force the HUB font for maximum PDF legibility.
        const htmlContent = generateHTML(data, lang, activity, qrDataURI, 'pdf', '', { theme: theme, fontSize: 18, fontStack: 'hub' });
        // Write a temporary HTML file for Playwright.
        const tempHtmlPath = path.join(__dirname, `temp_${lang}_${theme}.html`);
        fs.writeFileSync(tempHtmlPath, htmlContent);

        const page = await browser.newPage();
        await page.emulateMedia({ media: 'screen' });
        await page.setViewportSize({ width: 1400, height: 1200 });
        
        await page.goto(`file://${tempHtmlPath}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(100); 
        
        // Default file is Light: CV_Thomas_Bourcey_FR.pdf, Resume_Thomas_Bourcey_EN.pdf.
        
        let pdfName = "";
        if (lang === 'fr') {
            pdfName = theme === 'light' ? "CV_Thomas_Bourcey_FR.pdf" : `CV_Thomas_Bourcey_FR_${theme.charAt(0).toUpperCase() + theme.slice(1)}.pdf`;
        } else {
            pdfName = theme === 'light' ? "Resume_Thomas_Bourcey_EN.pdf" : `Resume_Thomas_Bourcey_EN_${theme.charAt(0).toUpperCase() + theme.slice(1)}.pdf`;
        }

        await page.pdf({
          path: path.join(__dirname, pdfName),
          format: 'A4',
          printBackground: true,
          scale: 0.65,
          margin: { top: '0px', right: '0px', bottom: '0px', left: '0px' }
        });
        if (theme === 'deep') {
          console.log(`  - Preview PNG...`);
          await page.setViewportSize({ width: 1200, height: 630 });
          await page.waitForTimeout(5000);
          await page.screenshot({ path: path.join(__dirname, `preview_${lang}.png`) });
        }

        await page.close();
        fs.unlinkSync(tempHtmlPath);
    }

    // Markdown & TXT (once per language).
    const mdContent = generateMarkdown(data, lang);
    const mdFileName = lang === 'fr' ? "CV_FR.md" : "Resume_EN.md";
    fs.writeFileSync(path.join(__dirname, mdFileName), mdContent);
    
    const txtContent = generatePlain(data, lang);
    const txtFileName = lang === 'fr' ? "CV_Thomas_Bourcey_FR.txt" : "Resume_Thomas_Bourcey_EN.txt";
    fs.writeFileSync(path.join(__dirname, txtFileName), txtContent);
  }
  await browser.close();
}

build().catch(err => {
  console.error('Build failed:', err);
  process.exit(1);
});
