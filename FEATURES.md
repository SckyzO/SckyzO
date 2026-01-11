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
    - *Note : Interaction survol (points) désactivée pour alléger.*
- [x] **Impact Metrics Highlighting**
    - Mise en valeur automatique des chiffres clés.
- [x] **GitHub Activity Badge**
    - Indicateur "Live" du dernier projet actif.

### 🛠️ Engineering
- [x] **Architecture Client/Serveur**
    - Séparation propre de `build.js` et `client.js`.
- [x] **SEO & Open Graph**
    - Génération automatique des previews PNG.

---

## 🚧 En cours / Prochaines étapes

### 🛠️ Engineering
- [ ] **Compilation CSS (No-CDN)** : Passage à un build Tailwind local (actuellement CDN pour stabilité Docker).

### 📄 PDF Spécifique
- [ ] **QR Code Dynamique** : Lien vers la version web sur le PDF.
- [ ] **Print Stylesheet** : Mode "Éco-ink" optimisé.

### Accessibilité
- [ ] **Mode Lecture (Focus)** : Version simplifiée pour la lisibilité.
- [ ] **A11y Audit** : Labels ARIA manquants, contraste.

---

## 📅 Changelog

- **09/01/2026** : Version stable avec toutes les fonctionnalités consolidées.
