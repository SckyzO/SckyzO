const https = require('https');

function highlightMetrics(text) {
  if (!text) return "";
  return text.replace(/(\b\d+(?:[.,]\d+)?%?|\b\d+\s*(?:servers?|nodes?|k|M|€|\$|users?|years?|projects?)\b|\d+\+)/gi, (match) => {
    return `<span class="accent-text font-black font-mono tracking-tight">${match}</span>`;
  });
}

function getAge(dateString) {
  const today = new Date();
  const birthDate = new Date(dateString);
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

function generateRadarChart(skills) {
  const size = 200;
  const center = size / 2;
  const radius = size * 0.4;
  const angleStep = (Math.PI * 2) / skills.length;
  
  const levelsMapping = { "Linux": 95, "HPC": 90, "Storage": 85, "DevOps": 88, "Observability": 92, "Cloud/Virt": 80, "Development": 85, "IoT/3D": 70 };

  const points = skills.map((s, i) => {
    const val = s.level || levelsMapping[s.category] || 50;
    const level = val / 100;
    const x = center + Math.cos(i * angleStep - Math.PI / 2) * radius * level;
    const y = center + Math.sin(i * angleStep - Math.PI / 2) * radius * level;
    return `${x},${y}`;
  }).join(' ');

  const gridLevels = [0.25, 0.5, 0.75, 1];
  const grids = gridLevels.map(l => {
    const p = skills.map((_, i) => {
      const x = center + Math.cos(i * angleStep - Math.PI / 2) * radius * l;
      const y = center + Math.sin(i * angleStep - Math.PI / 2) * radius * l;
      return `${x},${y}`;
    }).join(' ');
    return `<polygon points="${p}" fill="none" stroke="currentColor" stroke-width="0.5" opacity="0.1" />`;
  }).join('');

  const labels = skills.map((s, i) => {
    const x = center + Math.cos(i * angleStep - Math.PI / 2) * (radius + 25);
    const y = center + Math.sin(i * angleStep - Math.PI / 2) * (radius + 10);
    return `<text x="${x}" y="${y}" text-anchor="middle" font-size="8" font-weight="900" fill="currentColor" opacity="0.4" class="uppercase tracking-tighter">${s.category}</text>`;
  }).join('');

  return `<svg viewBox="0 0 ${size} ${size}" class="w-full h-full opacity-80">${grids}<polygon points="${points}" fill="var(--accent)" fill-opacity="0.2" stroke="var(--accent)" stroke-width="2" />${labels}</svg>`;
}

async function getGitHubActivity(username) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'api.github.com',
      path: `/users/${username}/events/public`,
      headers: { 'User-Agent': 'Node.js-CV-Builder' }
    };
    
    const req = https.get(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const events = JSON.parse(body);
          const lastPush = events.find(e => e.type === 'PushEvent');
          if (lastPush) {
            const repoName = lastPush.repo.name.split('/')[1];
            const date = new Date(lastPush.created_at);
            resolve({ repo: repoName, date: date });
          } else {
            resolve(null);
          }
        } catch (e) { resolve(null); }
      });
    });

    req.on('error', () => resolve(null));
    req.on('timeout', () => { req.destroy(); resolve(null); });
    req.setTimeout(3000); // 3s timeout
  });
}

module.exports = { highlightMetrics, getAge, generateRadarChart, getGitHubActivity };
