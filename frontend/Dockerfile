# 1. Aşama: Build (Node.js)
FROM node:20-alpine AS build-stage
WORKDIR /app

# Sadece package.json'ları kopyala (Cache dostu)
COPY package*.json ./
RUN npm install --legacy-peer-deps

# Kodun kalanını kopyala ve build al
COPY . .
RUN npm run build

# 2. Aşama: Production (Nginx)
FROM nginx:stable-alpine
# Custom Nginx Config (Sayfa yenileme hatasını çözer)
RUN echo 'server { \
    listen 80; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

COPY --from=build-stage /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]