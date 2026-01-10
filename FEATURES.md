# 🚀 Features Backlog & Roadmap

Ce document recense les fonctionnalités proposées, validées et en cours de développement pour le générateur de CV "SckyzO".

## ✅ Terminées (Commit 93a24c8)

### 🕹️ Interactivité & UX
- [x] **Terminal Mode (Easter Egg)**
    - Bouton `>_ TTY`, Toggle dans les réglages et raccourci `CTRL+ALT+T`.
    - Design Retro CRT (VT323 font, vert phosphorescent, scanlines).
- [x] **Language Flip 3D (Killer Feature)**
    - [x] Bouton "Drapeau" pour changer de langue.
    - [x] Animation de retournement 3D (Flip Card) des sections en cascade (staggered).
    - [x] Gestion intelligente de la hauteur variable (Grid Method).
    - [x] **SEO Friendly** : Utilisation de balises `hreflang`.
    - [ ] *TODO: Retravailler le design et l'alignement du bouton Drapeau dans le header.*

### 🛠️ Engineering & SEO
- [x] **SEO & Open Graph (Social Preview)**
    - Balises `meta` (og:title, og:image) pour un partage LinkedIn/Twitter propre.
    - Génération automatique de l'image de preview via Playwright lors du build.

---

## 🚧 En cours / À implémenter (Une par une)

### 🎨 Design & UI (Pixel Perfect)
- [ ] **Micro-Interactions "Glassmorphism" 2.0**
    - Effet de lueur/reflet qui suit la souris sur les cartes (Card Spotlight/Glow).
- [ ] **Scroll-Linked Animations (Timeline)**
    - Barre de progression verticale pour la section Expérience qui se remplit au scroll.
- [ ] **Settings Mobile**
    - Adaptation du panneau de configuration en "Bottom Sheet" pour mobile.

### 📈 Contenu & RH
- [ ] **Section "Side Projects" dédiée**
    - Grille de cartes pour les projets perso avec liens GitHub et badges technos.
- [ ] **Impact Metrics Highlighting**
    - Détection et mise en valeur automatique des chiffres clés (budgets, serveurs, pourcentages).

### Navigation & Outils
- [ ] **Command Palette (CTRL+K)**
    - Navigation rapide et recherche d'actions.
- [ ] **Cross-Highlighting**
    - Survoler un skill (ex: Ansible) illumine instantanément les expériences liées.

### Data Visualization
- [ ] **Radar Chart Expertise**
    - Graphique SVG pur pour visualiser les domaines de compétences.
- [ ] **GitHub Activity Badge**
    - Indicateur "Live" du dernier projet actif.

### Engineering
- [ ] **Compilation CSS (No-CDN)**
    - Passage à un build Tailwind local pour la performance et le offline.

---

## 📅 Changelog

- **09/01/2026** : Retour à l'état stable. Reprise itérative.