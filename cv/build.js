const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const QRCode = require('qrcode');
const { getGitHubActivity } = require('./src/utils');
const { generateHTML, generateMarkdown, generatePlain } = require('./src/templates');

// Chargement des données
const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'data.json'), 'utf8'));

const parseNumber = (value) => {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const getPdfAppearance = () => ({
  theme: process.env.PDF_THEME || null,
  accent: process.env.PDF_ACCENT || null,
  accentRgba: process.env.PDF_ACCENT_RGBA || null,
  fontSize: parseNumber(process.env.PDF_FONT_SIZE),
  fontStack: process.env.PDF_FONT_STACK || null
});

// --- MAIN BUILD PROCESS ---
async function build() {
  const browser = await chromium.launch();
  const activity = await getGitHubActivity(data.contact.github);
  const clientScript = fs.readFileSync(path.join(__dirname, 'client.js'), 'utf8');
  const pdfAppearance = getPdfAppearance();
  
  // 1. Génération de l'index interactif (Default FR)
  console.log("Génération de l'index interactif (index.html)...");
  const qrDefault = await QRCode.toDataURL('https://tomzone.fr', { margin: 1, width: 100, color: { dark: '#000000', light: '#ffffff' } });
  const htmlInteractive = generateHTML(data, 'fr', activity, qrDefault, 'interactive', clientScript);
  fs.writeFileSync(path.join(__dirname, "index.html"), htmlInteractive);

  // 2. Génération des fichiers dédiés PDF (FR/EN)
  for (const lang of ['fr', 'en']) {
    console.log("Génération du fichier PDF-optimisé pour " + lang.toUpperCase() + "...");
    
    // Génération QR
    const qrTarget = lang === 'fr' ? 'https://tomzone.fr/index_fr.html' : 'https://tomzone.fr/index_en.html';
    const qrDataURI = await QRCode.toDataURL(qrTarget, { margin: 1, width: 100, color: { dark: '#000000', light: '#ffffff' } });

    // Mode 'pdf' : pas de JS, pas d'anim, layout figé
    const htmlContent = generateHTML(data, lang, activity, qrDataURI, 'pdf', '', pdfAppearance);
    const htmlPath = path.join(__dirname, "index_" + lang + ".html");
    fs.writeFileSync(htmlPath, htmlContent);

    // Markdown & Txt
    const mdContent = generateMarkdown(data, lang);
    const mdFileName = lang === 'fr' ? "CV_FR.md" : "Resume_EN.md";
    fs.writeFileSync(path.join(__dirname, mdFileName), mdContent);
    
    const txtContent = generatePlain(data, lang);
    const txtFileName = lang === 'fr' ? "CV_Thomas_Bourcey_FR.txt" : "Resume_Thomas_Bourcey_EN.txt";
    fs.writeFileSync(path.join(__dirname, txtFileName), txtContent);

    // Playwright
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'networkidle' });
    await page.waitForTimeout(100); 
    const pdfFileName = lang === 'fr' ? "CV_Thomas_Bourcey_FR.pdf" : "Resume_Thomas_Bourcey_EN.pdf";
    await page.pdf({
      path: path.join(__dirname, pdfFileName), format: 'A4', printBackground: true,
      margin: { top: '0px', right: '0px', bottom: '0px', left: '0px' }
    });
    
    console.log(`Génération de la preview Open Graph pour ${lang}...`);
    await page.setViewportSize({ width: 1200, height: 630 });
    await page.waitForTimeout(100); 
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
