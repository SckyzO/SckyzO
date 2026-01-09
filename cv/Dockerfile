# Stage 1: Build
FROM mcr.microsoft.com/playwright:v1.40.0-jammy AS builder

WORKDIR /app

# Copie des fichiers de dépendances et installation
COPY package.json package-lock.json* ./
RUN npm install

# Copie des sources
COPY build.js data.json ./

# Génération des fichiers (HTML, PDF, MD)
RUN node build.js

# Stage 2: Serve
FROM nginx:alpine

# Copie des fichiers générés depuis le stage builder
COPY --from=builder /app/*.html /usr/share/nginx/html/
COPY --from=builder /app/*.pdf /usr/share/nginx/html/
COPY --from=builder /app/*.md /usr/share/nginx/html/
COPY --from=builder /app/*.png /usr/share/nginx/html/

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]