# Stage 1: Build Angular application
FROM node:18-alpine AS build
ARG BUILD_CONFIG=production
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build -- --configuration=${BUILD_CONFIG}

# Stage 2: Serve using Nginx
FROM nginx:1.25-alpine
COPY --from=build /app/dist/frontend/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
