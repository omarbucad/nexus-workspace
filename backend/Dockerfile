# ---------- Stage 1: Composer dependencies ----------
FROM composer:2 AS vendor
WORKDIR /app

COPY composer.json composer.lock ./

RUN composer install \
  --no-dev \
  --prefer-dist \
  --no-interaction \
  --optimize-autoloader \
  --ignore-platform-req=ext-pcntl \
  --no-scripts

COPY . .

RUN php artisan package:discover --ansi || true
RUN php artisan config:clear || true
RUN php artisan optimize:clear || true

# ---------- Stage 2: Frontend (Vite build) ----------
FROM node:20-alpine AS frontend
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY resources ./resources
COPY public ./public
COPY vite.config.* ./
COPY tailwind.config.* ./
COPY postcss.config.* ./

RUN npm run build


# ---------- Stage 3: PHP Runtime ----------
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

# Copy backend app
COPY --from=vendor /app /var/www

# Copy Vite build output
COPY --from=frontend /app/public/build /var/www/public/build

# Ensure Laravel can write to storage
RUN mkdir -p /var/www/storage /var/www/bootstrap/cache \
    && chown -R www-data:www-data /var/www/storage /var/www/bootstrap/cache \
    && chmod -R 775 /var/www/storage

# Clear any stale caches (safe in build)
RUN php artisan optimize:clear || true

# Entrypoint
COPY ./scripts/php-fpm-entrypoint /usr/local/bin/php-entrypoint
RUN chmod +x /usr/local/bin/php-entrypoint

ENTRYPOINT ["php-entrypoint"]
CMD ["php-fpm"]
