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
FROM php:8.4-fpm AS app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    libzip-dev \
    libpng-dev \
    libpq-dev \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install PHP extensions
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

# Copy entrypoint
COPY ./scripts/php-fpm-entrypoint /usr/local/bin/php-entrypoint

# Give permisisons to everything in bin/
RUN chmod a+x /usr/local/bin/*

ENTRYPOINT ["/usr/local/bin/php-entrypoint"]

CMD ["php-fpm"]
