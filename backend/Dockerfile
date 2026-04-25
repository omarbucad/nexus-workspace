# ---------- Stage 1: Composer dependencies ----------
FROM composer:2 AS vendor
WORKDIR /app

# Copy only composer files first (better caching)
COPY composer.json composer.lock ./

RUN composer install \
  --no-dev \
  --prefer-dist \
  --no-interaction \
  --optimize-autoloader \
  --ignore-platform-req=ext-pcntl

# Copy the rest of the app AFTER deps
COPY . .

RUN composer dump-autoload --optimize


# ---------- Stage 2: Frontend (Vite build) ----------
FROM node:20-alpine AS frontend
WORKDIR /app

# Install deps with cache efficiency
COPY package.json package-lock.json ./
RUN npm ci

# Copy ONLY frontend-related files
COPY resources ./resources
COPY public ./public
COPY vite.config.* ./
COPY tailwind.config.* ./
COPY postcss.config.* ./

# Build assets
RUN npm run build


# ---------- Stage 3: PHP runtime ----------
FROM php:8.4-fpm AS app

WORKDIR /var/www

# System dependencies
RUN apt-get update && apt-get install -y \
    curl \
    libzip-dev \
    libpng-dev \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# PHP extensions
RUN docker-php-ext-install pdo pdo_mysql gd bcmath zip sockets \
    && docker-php-ext-configure pcntl --enable-pcntl \
    && docker-php-ext-install pcntl \
    && pecl install redis \
    && docker-php-ext-enable redis

# Copy app (without node_modules, etc.)
COPY --from=vendor /app /var/www

# Copy built frontend assets ONLY
COPY --from=frontend /app/public/build /var/www/public/build

# Fix permissions
RUN chown -R www-data:www-data \
    /var/www/storage \
    /var/www/bootstrap/cache

# Clear Laravel caches (prevents stale Vite manifest issues)
RUN php artisan optimize:clear || true

# Entrypoint
COPY ./scripts/php-fpm-entrypoint /usr/local/bin/php-entrypoint
RUN chmod +x /usr/local/bin/php-entrypoint

ENTRYPOINT ["php-entrypoint"]
CMD ["php-fpm"]
