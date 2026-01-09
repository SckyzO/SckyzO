# 🚀 Features Backlog & Roadmap

Ce document recense les fonctionnalités proposées, validées et en cours de développement pour le générateur de CV "SckyzO".

## ✅ Validées / Prioritaires

### 🕹️ Interactivité & UX
- [x] **Language Flip 3D (Killer Feature)**
    - [x] Bouton "Drapeau" pour changer de langue.
    - [x] Animation de retournement 3D (Flip Card) des sections en cascade (staggered).
    - [x] Gestion intelligente de la hauteur variable (Grid Method).
    - [x] **SEO Friendly** : Utilisation de balises `hreflang`.
    - [ ] *TODO: Retravailler le design et l'alignement du bouton Drapeau dans le header.*

### 🎨 Design & UI (Pixel Perfect)
- [ ] **Micro-Interactions "Glassmorphism" 2.0**
    - Effet de lueur/reflet qui suit la souris sur les cartes (Card Spotlight/Glow).
    - Renforce l'aspect premium et technique.
- [ ] **Scroll-Linked Animations (Timeline)**
    - Barre de progression verticale pour la section Expérience qui se remplit au scroll.

### 📈 Contenu & RH
- [ ] **Impact Metrics Highlighting**
    - Détection et mise en valeur automatique des chiffres clés (budgets, serveurs, pourcentages) dans le texte.

### 🛠️ Engineering & SEO
- [ ] **SEO & Open Graph (Social Preview)**
    - Balises `meta` (og:title, og:image) pour un partage LinkedIn/Twitter propre.
    - Génération automatique de l'image de preview via Playwright lors du build.
- [ ] **Compilation CSS (No-CDN)**
    - Remplacer `<script src="cdn.tailwindcss">` par une build step CSS pour la performance et le "zero-flash".

---

## 🧪 À l'étude / Idées

### Navigation & Outils
- [ ] **Command Palette (CTRL+K)** : Navigation rapide et recherche de skills.
- [ ] **Settings Mobile** : Adaptation du panneau de configuration en "Bottom Sheet" pour mobile.
- [ ] **Terminal Mode** : Easter egg transformant l'UI en console TTY.

### Data Visualization
- [ ] **Radar Chart Expertise** : Graphique SVG pour les domaines de compétences (DevOps, HPC...).
- [ ] **GitHub Activity Badge** : Indicateur "Live" du dernier projet actif.
- [ ] **Cross-Highlighting** : Survoler un skill illumine les expériences liées.

### PDF Spécifique
- [ ] **QR Code Dynamique** : Sur le PDF imprimé, un QR code vers la version web.
- [ ] **Print Stylesheet** : Mode "Éco-ink" optimisé pour l'impression N&B.

### Accessibilité
- [ ] **Mode Lecture (Focus)** : Version simplifiée pour la lisibilité.
- [ ] **A11y Audit** : Labels ARIA manquants, contraste.

---

## 📅 Changelog

- **09/01/2026** : Création du backlog. Validation du concept "Language Flip 3D".
