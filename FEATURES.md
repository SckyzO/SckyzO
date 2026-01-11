# 🚀 Features Backlog & Roadmap

Ce document recense les fonctionnalités proposées, validées et en cours de développement pour le générateur de CV "SckyzO".

## ✅ Terminées

### 🕹️ Interactivité & UX
- [x] **Terminal Mode (Easter Egg)**
    - Bouton `>_ TTY`, Toggle "Matrix Mode" dans les réglages et raccourci `CTRL+ALT+T`.
- [x] **Language Flip 3D (Killer Feature)**
    - Sélecteur "Segmented Control" (FR/EN) avec drapeaux intégré dans le Settings Panel.
    - Animation de retournement 3D (Flip Card).
- [x] **Command Palette (CTRL+K)**
    - Navigation rapide et recherche d'actions.
- [x] **Cross-Highlighting**
    - Survoler un skill (ex: Ansible) illumine instantanément les expériences liées.
- [x] **Settings Mobile**
    - Adaptation du panneau de configuration en "Bottom Sheet".

### 🎨 Design & UI (Pixel Perfect)
- [x] **Refonte Section Contact**
    - Design "Clean List" avec icônes, Heure locale et Âge calculé.
    - Intégration des boutons GitHub et LinkedIn.
- [x] **Section "Side Projects"**
    - Grille de cartes avec liens GitHub.
- [x] **Settings Panel Unifié**
    - UI harmonisée avec des "Segmented Controls".

### 📊 Visualisation & Contenu
- [x] **Radar Chart Expertise**
    - Graphique SVG pur pour visualiser les domaines de compétences.
- [x] **Impact Metrics Highlighting**
    - Mise en valeur automatique des chiffres clés (chiffres, %, métriques).
- [x] **GitHub Activity Badge**
    - Indicateur "Live" du dernier projet actif via API GitHub.

### 🛠️ Engineering & Stabilité
- [x] **Architecture PDF Factory**
    - Pages HTML dédiées (`index_fr.html` / `index_en.html`) pour un rendu déterministe.
    - `pdf-mode` : Désactivation des JS/Animations pour une stabilité 100% pixel-perfect.
- [x] **Offline Resilience**
    - Téléchargement local des assets (Tailwind, Lucide) pour build sans dépendance réseau.
- [x] **Export Multi-Format**
    - PDF (Chromium), Markdown et **ATS Friendly (.txt)**.
- [x] **SEO & Social Metadata**
    - OpenGraph, Twitter Cards, balises Canonical et Hreflang.
- [x] **QR Code Dynamique**
    - QR Code "Live Version" généré localement et injecté dans le PDF.
- [x] **Déploiement CI/CD**
    - Pipeline GitHub Actions automatisé pour déploiement sur GitHub Pages.
- [x] **Refactoring Modulaire**
    - Architecture propre : `build.js` orchestrateur + `src/` (templates, utils, i18n).

### 📄 PDF & Print
- [x] **Print Stylesheet Optimisée**
    - Force le noir pur, expose les URLs des liens, masque les artefacts UI.
- [x] **Stabilité des Timeouts**
    - Gestion sécurisée des requêtes API et des délais Playwright.

---

## 📅 Changelog

- **11/01/2026** : Version Finale (CI/CD, Refactor, Offline, PDF Factory).
- **09/01/2026** : Version stable avec fonctionnalités interactives (Flip 3D, Cmd Palette).
