const fs = require('fs');
const path = require('path');
const https = require('https');

const ASSETS_DIR = path.join(__dirname, '../assets');
if (!fs.existsSync(ASSETS_DIR)) fs.mkdirSync(ASSETS_DIR);

const assets = [
  { name: 'tailwind.js', url: 'https://cdn.tailwindcss.com' },
  { name: 'lucide.js', url: 'https://unpkg.com/lucide@latest' }
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
  if (failures.length > 0) {
    console.error(`Asset download failed for: ${failures.join(', ')}`);
    console.error('Offline build requires these files. Re-run when network access is available.');
    process.exit(1);
  }
  console.log('Assets downloaded.');
}

main();
