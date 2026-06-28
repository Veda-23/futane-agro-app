# Stage 1: Build Angular Application
FROM node:18-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install --legacy-peer-deps
COPY . .
RUN npm run build -- --configuration production

# Stage 2: Serve using Nginx
FROM nginx:1.25-alpine
# Copy built artifacts from Stage 1
COPY --from=build /app/dist/frontend/browser /usr/share/nginx/html
# Copy custom nginx configuration if exists, else use default
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
