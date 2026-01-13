# Stage 1: Build
FROM mcr.microsoft.com/playwright:v1.57.0-jammy AS builder

WORKDIR /app

# Copie des fichiers de dépendances et installation
COPY package.json package-lock.json* ./
RUN npm install

# Copie des sources
COPY build/ ./build/
COPY assets/ ./assets/
COPY data/ ./data/
COPY src/ ./src/

# Téléchargement des assets pour le mode offline
RUN node build/download-assets.js

# Génération des fichiers (HTML, PDF, MD)
RUN node build/build.js

# Stage 2: Serve
FROM nginx:alpine

# Copie des fichiers générés depuis le stage builder
COPY --from=builder /app/dist/ /usr/share/nginx/html/

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
