# CV Generator - Thomas Bourcey

Un générateur de CV moderne, performant et automatisé, conçu pour produire un site web interactif et des PDF pixel-perfect à partir d'une source unique de données JSON.

🌐 **Live Demo :** [sckyzo.github.io/SckyzO/](https://sckyzo.github.io/SckyzO/)

## 🚀 Fonctionnalités Clés

### 🎨 Frontend & UX
- **Flip 3D Bilingue** : Bascule instantanée FR/EN sans rechargement de page.
- **Mode Terminal (TTY)** : Easter egg pour les recruteurs tech (`CTRL+ALT+T`).
- **Command Palette** : Navigation clavier type VS Code (`CTRL+K`).
- **Cross-Highlighting** : Survoler une compétence illumine les expériences associées.
- **Responsive** : Mobile-first avec panneau de réglages en bottom-sheet.

### ⚙️ Engineering & Build
- **Source Unique** : Tout le contenu est dans `data.json`.
- **PDF Factory Déterministe** :
  - Génération via Playwright (Chromium Headless).
  - Pages dédiées (`index_fr.html`, `index_en.html`) sans JS/Animations pour une stabilité absolue.
  - CSS Print optimisé (Noir pur, liens exposés, suppression UI).
- **Offline First** : Script de pré-téléchargement des assets (Tailwind, Lucide) pour un build résilient.
- **ATS Friendly** : Export automatique en `.txt` structuré pour les robots recruteurs.
- **CI/CD** : Déploiement automatique sur GitHub Pages via GitHub Actions.

## 🛠️ Architecture

```
cv/
├── build.js            # Orchestrateur de build (Node.js)
├── client.js           # Logique UI interactive (Browser)
├── data.json           # Source de vérité du contenu
├── download-assets.js  # Gestionnaire de dépendances offline
├── src/                # Modules logiques
│   ├── templates.js    # Générateurs HTML/MD/TXT
│   ├── utils.js        # Helpers (Calculs, Graphiques, API)
│   └── i18n.js         # Dictionnaire de traduction
├── Dockerfile          # Environnement de référence
└── assets/             # Dépendances locales (généré)
```

## 📦 Installation & Utilisation

### Via Docker (Recommandé)
L'environnement Docker gère tout : dépendances, téléchargement assets, build et serveur de prévisualisation.

```bash
cd cv
docker compose up --build
```
Le site est accessible sur `http://localhost:8080`.

### En Local (Node.js)
Pré-requis : Node.js 20+ et Playwright.

```bash
cd cv
npm install
npx playwright install chromium
node download-assets.js
node build.js
```

## 📄 Formats de Sortie

Le build génère automatiquement dans le dossier racine :
- `index.html` : Site web interactif complet.
- `CV_Thomas_Bourcey_FR.pdf` : Version PDF optimisée pour impression.
- `CV_Thomas_Bourcey_FR.txt` : Version texte brut pour ATS.
- `CV_FR.md` : Version Markdown.
- (Et les équivalents EN).

## 🤖 CI/CD

Le workflow `.github/workflows/deploy.yml` s'exécute à chaque push sur `main` :
1. Installe l'environnement.
2. Télécharge les assets.
3. Lance le build.
4. Déploie les artefacts sur la branche `gh-pages`.

---
*Développé avec passion par Thomas Bourcey.*
