# 🚀 SckyzO CV Generator

Bienvenue sur le dépôt du générateur de CV de **Thomas Bourcey (SckyzO)**. Ce projet remplace l'ancien site `tomzone.fr` par une approche "Data-Driven" moderne.

Il génère automatiquement un CV professionnel sous trois formats (**HTML, PDF, Markdown**) et en deux langues (**Français, Anglais**) à partir d'une source de données unique.

## 🏗 Architecture

Le projet est conçu pour être statique, performant et automatisé.

- **Données** : `cv/data.json` (Source unique de vérité).
- **Moteur de Rendu** : Node.js + Template Strings (Pas de framework lourd type React/Vue).
- **Style** : Tailwind CSS (Themeable : Light, Dark, Deep).
- **PDF Generation** : [Playwright](https://playwright.dev/) (Chromium) pour un rendu pixel-perfect.
- **Iconographie** : Lucide Icons.
- **Automatisation** : Docker & GitHub Actions.

## 📂 Structure du Projet

```bash
/cv
├── build.js          # Script principal (Génération HTML -> MD -> PDF)
├── data.json         # Données du CV (Expériences, Skills, Contact...)
├── Dockerfile        # Image de production (Nginx) et Build stage
├── docker-compose.yml # Environnement de développement local
└── .github/workflows # Pipeline CI/CD
```

## 🛠 Installation & Développement

L'environnement de développement est conteneurisé. Vous n'avez besoin que de **Docker**.

### 1. Lancer l'environnement
Utilisez Docker Compose pour lancer le "watcher" (qui surveille les modifications) et le serveur de prévisualisation.

```bash
cd cv
docker compose up
```

### 2. Accéder au CV
Une fois lancé, le CV est accessible en local :
- **Français** : http://localhost:8080/index_fr.html
- **Anglais** : http://localhost:8080/index_en.html
- **PDF** : http://localhost:8080/CV_Thomas_Bourcey_FR.pdf

Le service `builder` régénère automatiquement les fichiers (HTML, PDF, MD) à chaque modification de `data.json` ou `build.js`.

## 📦 Pipeline CI/CD (GitHub Actions)

Le workflow `.github/workflows/generate-cv.yml` s'exécute à chaque push sur `main` :

1.  **Build** : Installe les dépendances et exécute `build.js`.
2.  **Artifacts** : Sauvegarde les fichiers générés (PDF, HTML, MD).
3.  **Deploy** : (En cours) Déploie les fichiers statiques vers le serveur de production (`tomzone.fr`).

## ✨ Fonctionnalités Uniques

- **Thèmes Dynamiques** : Le visiteur peut changer le thème (Couleurs, Polices) en temps réel.
- **Onboarding** : Une "aura" guide les nouveaux visiteurs vers les paramètres.
- **Impression Parfaite** : Le PDF est généré via un moteur Chromium headless, garantissant que le document imprimé est identique au design écran.

## 📄 Licence

Ce projet est personnel. Le code est ouvert, mais les données personnelles (dans `data.json`) m'appartiennent.