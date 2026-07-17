const fs = require('fs');
const path = require('path');
const https = require('https');

const ASSETS_DIR = path.join(__dirname, '../assets');
if (!fs.existsSync(ASSETS_DIR)) fs.mkdirSync(ASSETS_DIR);

// Pin exact versions so offline assets are reproducible. Bumping these is an
// explicit, reviewable change (the previous "@latest" silently drifted).
const assets = [
  { name: 'tailwind.js', url: 'https://cdn.tailwindcss.com/3.4.17' },
  { name: 'lucide.js', url: 'https://unpkg.com/lucide@1.25.0/dist/umd/lucide.min.js' }
];

async function download(url, dest) {
  return new Promise((resolve, reject) => {
    const handleResponse = (res) => {
      // Handle redirects (301, 302, 303, 307, 308).
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        let newUrl = res.headers.location;
        if (newUrl.startsWith('/')) {
          const originalUrl = new URL(url);
          newUrl = `${originalUrl.protocol}//${originalUrl.host}${newUrl}`;
        }
        console.log(`-> Redirecting to ${newUrl}`);
        https.get(newUrl, handleResponse).on('error', reject);
        return;
      }

      if (res.statusCode !== 200) {
        reject(new Error(`Status code: ${res.statusCode}`));
        return;
      }

      const file = fs.createWriteStream(dest);
      res.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    };

    const req = https.get(url, handleResponse);
    
    req.on('error', (err) => {
      fs.unlink(dest, () => {}); 
      reject(err);
    });

    req.setTimeout(10000, () => {
        req.destroy();
        reject(new Error('Request timeout'));
    });
  });
}

function fetchText(url, headers) {
  return new Promise((resolve, reject) => {
    const handle = (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        https.get(res.headers.location, { headers }, handle).on('error', reject);
        return;
      }
      if (res.statusCode !== 200) { reject(new Error(`Status code: ${res.statusCode}`)); return; }
      let body = '';
      res.on('data', (c) => { body += c; });
      res.on('end', () => resolve(body));
    };
    const req = https.get(url, { headers }, handle);
    req.on('error', reject);
    req.setTimeout(10000, () => { req.destroy(new Error('Request timeout')); });
  });
}

// Self-host Montserrat so the build never depends on Google Fonts at render
// time (that dependency caused headless screenshots to hang offline).
async function downloadFonts() {
  console.log('- montserrat.css...');
  const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
  const cssUrl = 'https://fonts.googleapis.com/css2?family=Montserrat:wght@100..900&display=swap';
  const css = await fetchText(cssUrl, { 'User-Agent': ua });
  const fontsDir = path.join(ASSETS_DIR, 'fonts');
  if (!fs.existsSync(fontsDir)) fs.mkdirSync(fontsDir, { recursive: true });

  const urls = [...new Set([...css.matchAll(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+\.woff2)\)/g)].map((m) => m[1]))];
  let localCss = css;
  let i = 0;
  for (const url of urls) {
    const file = `montserrat-${i++}.woff2`;
    await download(url, path.join(fontsDir, file));
    localCss = localCss.split(url).join(`fonts/${file}`);
  }
  fs.writeFileSync(path.join(ASSETS_DIR, 'montserrat.css'), localCss);
  console.log(`  (${urls.length} Montserrat font files inlined offline)`);
}

async function main() {
  console.log('Downloading offline assets...');
  const failures = [];
  for (const asset of assets) {
    console.log(`- ${asset.name}...`);
    try {
      const destPath = path.join(ASSETS_DIR, asset.name);
      await download(asset.url, destPath);
      // Post-process: Remove source map comments
      let content = fs.readFileSync(destPath, 'utf8');
      if (content.includes('sourceMappingURL=')) {
        content = content.replace(/^\/\/#\s*sourceMappingURL=.*$/gm, '');
        fs.writeFileSync(destPath, content);
        console.log(`  (Cleaned source map from ${asset.name})`);
      }
    } catch (e) {
      console.error(`Failed to download ${asset.name}:`, e.message);
      failures.push(asset.name);
    }
  }
  try {
    await downloadFonts();
  } catch (e) {
    console.error('Failed to download Montserrat:', e.message);
    failures.push('montserrat.css');
  }
  if (failures.length > 0) {
    console.error(`Asset download failed for: ${failures.join(', ')}`);
    console.error('Offline build requires these files. Re-run when network access is available.');
    process.exit(1);
  }
  console.log('Assets downloaded.');
}

main();
