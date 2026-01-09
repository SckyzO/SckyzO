FROM nginx:alpine
# Copie les fichiers générés localement vers le serveur Nginx
COPY *.html /usr/share/nginx/html/
COPY *.pdf /usr/share/nginx/html/
COPY *.md /usr/share/nginx/html/
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]