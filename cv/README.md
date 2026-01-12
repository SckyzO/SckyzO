# CV Generator - Thomas Bourcey

A modern CV generator that builds an interactive website and pixel-perfect PDFs from a single JSON data source.

Live demo: https://sckyzo.github.io/SckyzO/

## Key Features

### Frontend and UX
- Bilingual 3D flip with instant FR/EN toggle (no reload).
- TTY mode easter egg for tech audiences (CTRL+ALT+T).
- Command palette navigation (CTRL+K).
- Cross-highlighting between skills and experiences.
- Mobile-first layout with a bottom-sheet settings panel.

### Engineering and Build
- Single source of truth in `data/data.json`.
- Deterministic PDF factory via Playwright (Chromium Headless).
- Dedicated PDF pages (`index_fr.html`, `index_en.html`) without JS/animations.
- Offline-first asset download (Tailwind, Lucide) for resilient builds.
- ATS-friendly `.txt` export.
- CI/CD deployment to GitHub Pages with GitHub Actions.

## Architecture

```
cv/
├── build/              # Build tooling
│   ├── build.js         # Build orchestrator (Node.js)
│   └── download-assets.js  # Offline asset downloader
├── src/                # Core modules
│   ├── templates/      # HTML/MD/TXT generators
│   │   └── index.js    # Entry point
│   ├── styles/         # Shared styles
│   │   └── main.css    # Base stylesheet
│   ├── scripts/        # Frontend logic
│   │   └── client.js   # Interactive UI logic (browser)
│   ├── utils.js        # Helpers (metrics, charts, API)
│   └── i18n.js         # Translation dictionary
├── data/               # Content source of truth
│   └── data.json       # Single source of truth
├── Dockerfile          # Reference environment
└── assets/             # Local dependencies (generated)
```

## Install and Usage

### Docker (recommended)
Docker manages dependencies, offline assets, build, and preview server.

```bash
cd cv
docker compose up --build
```

Preview is available at http://localhost:8080.

### Local (Node.js)
Requirements: Node.js 20+ and Playwright.

```bash
cd cv
npm install
npm run validate
npx playwright install --with-deps chromium
node build/download-assets.js
node build/build.js
```

## Outputs

The build generates the following files in the `cv/` directory:
- `index.html` interactive website.
- `CV_Thomas_Bourcey_FR.pdf` print-optimized PDF.
- `CV_Thomas_Bourcey_FR.txt` ATS-friendly text.
- `CV_FR.md` Markdown version.
- English equivalents for all outputs.

## Build Configuration

Optional environment variables to customize PDF output:

- `PDF_THEME`: `light`, `deep`, or `dark`. When set, only that theme is generated.
- `PDF_ACCENT`: Hex color (example: `#3b82f6`).
- `PDF_ACCENT_RGBA`: RGB color (example: `59, 130, 246`).
- `PDF_FONT_SIZE`: Number between 12 and 20.
- `PDF_FONT_STACK`: `hub`, `geist`, `space`, `archivo`, `quantum`, `console`, `architect`, or `oxy`.

Example:

```bash
PDF_THEME=deep PDF_ACCENT=#10b981 PDF_FONT_SIZE=18 node build/build.js
```

## CI/CD (GitHub Pages)

Workflow: `.github/workflows/deploy.yml`

On each push to `main`, the workflow:
1. Installs dependencies.
2. Downloads offline assets.
3. Builds all outputs.
4. Publishes the `cv/` directory to GitHub Pages.

Ensure GitHub Pages is configured to use GitHub Actions as the source.

## CI/CD (SFTP)

Workflow: `.github/workflows/deploy-sftp.yml`

Required GitHub Actions secrets:
- `SFTP_HOST`
- `SFTP_PORT`
- `SFTP_USER`
- `SFTP_PASSWORD` (SFTP account password)
- `SFTP_REMOTE_PATH` (target directory, example: `www`)

The workflow builds the CV and syncs `cv/build/` to the remote path using `rsync --delete`.
