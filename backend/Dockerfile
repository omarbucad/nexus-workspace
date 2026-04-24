
# ---------- Stage 1: Composer deps ----------
FROM composer:2 AS vendor
WORKDIR /app
COPY composer.json composer.lock ./
RUN composer install \
  --no-dev \
  --prefer-dist \
  --no-interaction \
  --optimize-autoloader
COPY . .

# ---------- Stage 2: Frontend build ----------
FROM node:20-alpine AS frontend
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# ---------- Stage 3: Runtime ----------
FROM php:8.3-fpm-alpine AS app

# Install only runtime deps; keep it tight
RUN apk add --no-cache \
    icu-libs libzip libpng freetype \
  && apk add --no-cache --virtual .build-deps \
    icu-dev libzip-dev libpng-dev freetype-dev oniguruma-dev $PHPIZE_DEPS \
  && docker-php-ext-install pdo pdo_mysql intl zip mbstring opcache \
  && apk del .build-deps

WORKDIR /var/www

# Copy only what you need from build stages
COPY --from=vendor /app /var/www
COPY --from=frontend /app/public/build /var/www/public/build

# Permissions (Laravel needs these)
RUN chown -R www-data:www-data /var/www/storage /var/www/bootstrap/cache

USER www-data
CMD ["php-fpm"]
