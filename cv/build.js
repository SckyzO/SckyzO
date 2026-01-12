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
  const themes = ['light', 'deep', 'dark'];
  
  for (const lang of ['fr', 'en']) {
    console.log("Génération des assets pour " + lang.toUpperCase() + "...");
    
    // Génération QR
    const qrTarget = lang === 'fr' ? 'https://tomzone.fr/index_fr.html' : 'https://tomzone.fr/index_en.html';
    const qrDataURI = await QRCode.toDataURL(qrTarget, { margin: 1, width: 100, color: { dark: '#000000', light: '#ffffff' } });

    // Génération des PDFs pour chaque thème
    for (const theme of themes) {
        console.log(`  - PDF ${theme}...`);
        // On force la police HUB (Inter) pour une lisibilité maximale sur le PDF
        const htmlContent = generateHTML(data, lang, activity, qrDataURI, 'pdf', '', { theme: theme, fontSize: 18, fontStack: 'hub' });
        // On écrit un fichier temporaire pour Playwright
        const tempHtmlPath = path.join(__dirname, `temp_${lang}_${theme}.html`);
        fs.writeFileSync(tempHtmlPath, htmlContent);

        const page = await browser.newPage();
        await page.emulateMedia({ media: 'screen' });
        await page.setViewportSize({ width: 1400, height: 1200 });
        
        await page.goto(`file://${tempHtmlPath}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(100); 
        
        // Nom du fichier : CV_Thomas_Bourcey_FR_Light.pdf
        // Pour le défaut (Light), on garde peut-être le nom court ? Non, soyons explicites ou faisons un lien symbolique.
        // Décision : Le fichier "par défaut" (lien principal) sera Light. 
        // On génère : CV_Thomas_Bourcey_FR.pdf (Light), CV_Thomas_Bourcey_FR_Dark.pdf, etc.
        
        let pdfName = "";
        if (lang === 'fr') {
            pdfName = theme === 'light' ? "CV_Thomas_Bourcey_FR.pdf" : `CV_Thomas_Bourcey_FR_${theme.charAt(0).toUpperCase() + theme.slice(1)}.pdf`;
        } else {
            pdfName = theme === 'light' ? "Resume_Thomas_Bourcey_EN.pdf" : `Resume_Thomas_Bourcey_EN_${theme.charAt(0).toUpperCase() + theme.slice(1)}.pdf`;
        }

                await page.pdf({
                  path: path.join(__dirname, pdfName), format: 'A4', printBackground: true,
                  scale: 0.65, margin: { top: '0px', right: '0px', bottom: '0px', left: '0px' }
                });        if (theme === 'deep') { // On utilise le thème Deep pour la preview PNG
             console.log(`  - Preview PNG...`);
             await page.setViewportSize({ width: 1200, height: 630 });
             await page.waitForTimeout(100); 
             await page.screenshot({ path: path.join(__dirname, `preview_${lang}.png`) });
        }

        await page.close();
        fs.unlinkSync(tempHtmlPath); // Nettoyage
    }

    // Markdown & Txt (inchangés) -> Une seule fois par langue
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
  console.error('Erreur pendant le build:', err);
  process.exit(1);
});
