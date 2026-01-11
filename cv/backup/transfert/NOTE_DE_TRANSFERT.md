# Note de Transfert de Projet - SckyzO CV Generator

**Date :** 09 Janvier 2026
**État :** Stable, Fonctionnel, Features avancées intégrées.

## 🏗 Architecture Actuelle (Refondue)

Le projet a évolué d'un script monolithique vers une architecture plus maintenable :

1.  **`cv/build.js` (Node.js)** :
    *   Script de génération "Serveur".
    *   Lit `data.json`.
    *   Récupère l'activité GitHub via API (`https`).
    *   Compile le template HTML (String literals).
    *   Injecte le CSS (Tailwind CDN pour stabilité) et le JS Client.
    *   Utilise Playwright pour générer le PDF et les Previews PNG.

2.  **`cv/client.js` (Browser JS)** :
    *   Contient toute la logique interactive exécutée dans le navigateur.
    *   Gère le **Language Flip 3D** (basculement des classes CSS).
    *   Gère le **Settings Panel** (Thèmes, Matrix Mode, Font Size).
    *   Gère la **Command Palette** (CTRL+K).
    *   Gère le **Cross-Highlighting** et l'interaction avec le **Radar Chart**.
    *   Gère l'horloge locale.
    *   Ce fichier est lu par `build.js` et injecté dans la balise `<script>`.

3.  **`cv/data.json`** :
    *   Contient toutes les données (Profil, Expériences, Skills).
    *   Nouvelle section `projects` ajoutée.
    *   Champs ajoutés : `phone`, `birthDate`, `email` (mis à jour).

## ✨ Fonctionnalités Implémentées

*   **Language Flip 3D** : Basculement visuel complet FR/EN.
*   **Header** : Design épuré, bouton Download PDF, Badge GitHub "Live Activity".
*   **Contact** : Nouvelle liste épurée avec icônes, heure locale (Paris), âge calculé, et boutons sociaux intégrés.
*   **Radar Chart** : Graphique SVG pur dans la sidebar, interactif au survol des cartes de compétences.
*   **Settings Panel** : UI unifiée avec des "Segmented Controls" pour la Langue, l'Apparence et le Mode Matrix.
*   **Matrix Mode (TTY)** : Thème rétro vert/noir activable.
*   **Command Palette** : Navigation au clavier (CTRL+K).

## ⚠️ Points d'Attention pour le Repreneur

1.  **Injection JS** : `build.js` lit `client.js` via `fs.readFileSync`. Si vous modifiez `client.js`, il faut relancer le build pour que le HTML soit mis à jour.
2.  **Tailwind** : Nous sommes repassés au CDN (`cdn.tailwindcss.com`) car la compilation locale dans Docker posait des problèmes de PATH/Permissions instables. Une migration vers un build step propre est souhaitable à terme.
3.  **Cross-Highlighting** : Utilise une normalisation "slug" (`[^a-z0-9]`) pour faire correspondre les noms d'outils (ex: "Red Hat" <-> "redhat").
4.  **Docker** : Le conteneur `builder` utilise `nodemon` pour rebuilder à chaque changement.

## 📂 Fichiers Clés

*   `cv/build.js` : Générateur.
*   `cv/client.js` : Logique Front.
*   `cv/data.json` : Données.
*   `FEATURES.md` : Roadmap à jour.

---
**Le diff complet est disponible dans `full_diff.patch`.**
