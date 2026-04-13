# STEP 1: Build Phase
FROM node:20-alpine AS build-stage

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install --legacy-peer-deps

# Copy code and build
COPY . .
# Vite requires environment variables at build time
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# STEP 2: Production Phase (Nginx)
FROM nginx:stable-alpine AS production-stage

# Copy built files to Nginx
COPY --from=build-stage /app/dist /usr/share/nginx/html

# Expose port 80 (Standard Nginx)
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]