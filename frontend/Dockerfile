# syntax=docker/dockerfile:1

# ============================================
# Stage 1: Build React/Vite Application
# ============================================
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies first for better Docker layer caching
COPY package.json package-lock.json ./
RUN npm ci

# Copy application source
COPY . .

# Production API configuration
ARG VITE_API_URL=/api
ARG VITE_BACKEND_URL=

ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_BACKEND_URL=${VITE_BACKEND_URL}

# Build production frontend
RUN npm run build


# ============================================
# Stage 2: Serve with Nginx
# ============================================
FROM nginx:1.27-alpine AS runtime

# Remove default Nginx configuration
RUN rm /etc/nginx/conf.d/default.conf

# Copy our production Nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Copy compiled React application
COPY --from=builder /app/dist /usr/share/nginx/html

# Nginx listens on port 80
EXPOSE 80

# Run Nginx in foreground so Docker can manage the process
CMD ["nginx", "-g", "daemon off;"]