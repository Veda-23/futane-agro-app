# Stage 1: Serve using Nginx (Pre-built locally to save VM memory)
FROM nginx:1.25-alpine
COPY dist/frontend/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
