# 1. Aşama: Build (İnşa)
FROM node:20-alpine AS build

WORKDIR /app

# Bağımlılıkları kopyala ve yükle
COPY package*.json ./

# İŞTE SİHİRLİ SATIR BURADA!
RUN npm install --legacy-peer-deps

# Kaynak kodları kopyala ve build al
COPY . .
RUN npm run build

# 2. Aşama: Production (Sunum)
FROM nginx:stable-alpine

# Nginx'in varsayılan HTML klasörüne build çıktılarını kopyala
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]