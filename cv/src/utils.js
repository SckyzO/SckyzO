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
  
  const levelsMapping = {
    "Linux & Infrastructure": 95,
    "HPC Systems": 90,
    "Observability": 92,
    "Storage & Data": 85,
    "DevOps & Automation": 88,
    "Development & Tooling": 84
  };

  const pointPositions = skills.map((s, i) => {
    const val = s.level || levelsMapping[s.category] || 50;
    const level = val / 100;
    const x = center + Math.cos(i * angleStep - Math.PI / 2) * radius * level;
    const y = center + Math.sin(i * angleStep - Math.PI / 2) * radius * level;
    return { x, y, category: s.category };
  });

  const points = pointPositions.map((pos) => `${pos.x},${pos.y}`).join(' ');

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

  const highlightPoints = pointPositions.map((pos) => {
    return `<circle class="radar-point" cx="${pos.x}" cy="${pos.y}" r="3" data-category="${pos.category}" />`;
  }).join('');

  return `<svg viewBox="0 0 ${size} ${size}" class="w-full h-full opacity-80">${grids}<polygon points="${points}" fill="var(--accent)" fill-opacity="0.2" stroke="var(--accent)" stroke-width="2" />${highlightPoints}${labels}</svg>`;
}

const GITHUB_HOST = 'api.github.com';
const GITHUB_TIMEOUT_MS = 5000;

function fetchGitHubJson(path, headers, timeoutMs = GITHUB_TIMEOUT_MS) {
  return new Promise((resolve, reject) => {
    const req = https.request({ hostname: GITHUB_HOST, path, headers, method: 'GET' }, (res) => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => {
        const statusCode = res.statusCode || 0;
        if (statusCode >= 400) {
          const rateRemaining = res.headers['x-ratelimit-remaining'];
          const rateReset = res.headers['x-ratelimit-reset'];
          const rateInfo = rateRemaining === '0' && rateReset
            ? ` Rate limit resets at ${new Date(Number(rateReset) * 1000).toISOString()}.`
            : '';
          return reject(new Error(`GitHub API request failed (${statusCode}) for ${path}.${rateInfo}`));
        }
        try {
          resolve(JSON.parse(body));
        } catch (error) {
          reject(new Error(`Invalid JSON from GitHub API for ${path}: ${error.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(new Error(`GitHub API request error for ${path}: ${error.message}`));
    });

    req.setTimeout(timeoutMs, () => {
      req.destroy(new Error(`Request timeout after ${timeoutMs}ms`));
    });

    req.end();
  });
}

async function getGitHubActivity(username) {
  if (!username) {
    console.error('GitHub username is missing; activity badge will be skipped.');
    return null;
  }

  const headers = { 'User-Agent': 'Node.js-CV-Builder' };

  try {
    const user = await fetchGitHubJson(`/users/${username}`, headers);
    const publicRepos = user.public_repos || 0;
    let repo = null;
    let date = null;

    try {
      const events = await fetchGitHubJson(`/users/${username}/events/public`, headers);
      const lastPush = Array.isArray(events) ? events.find(e => e.type === 'PushEvent') : null;
      repo = lastPush && lastPush.repo ? lastPush.repo.name.split('/')[1] : null;
      date = lastPush && lastPush.created_at ? new Date(lastPush.created_at) : null;
    } catch (error) {
      console.error(`GitHub activity fetch failed: ${error.message}`);
    }

    return { repo, date, public_repos: publicRepos };
  } catch (error) {
    console.error(`GitHub user fetch failed: ${error.message}`);
    return null;
  }
}

module.exports = { highlightMetrics, getAge, generateRadarChart, getGitHubActivity };
