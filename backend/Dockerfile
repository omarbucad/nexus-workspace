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
RUN docker-php-ext-install pdo pdo_mysql pgsql pdo_pgsql gd bcmath zip sockets \
    && docker-php-ext-configure pcntl --enable-pcntl \
    && docker-php-ext-install pcntl \
    && pecl install redis \
    && docker-php-ext-enable redis \

# Run Laravel commands and set permissions
RUN php artisan package:discover --ansi \
    && chmod -R 775 storage bootstrap/cache \
    && chown -R www-data:www-data storage bootstrap/cache \
    && mkdir -p storage/framework/{sessions,views,cache}

# Copy entrypoint
COPY ./scripts/php-fpm-entrypoint /usr/local/bin/php-entrypoint

# Give permisisons to everything in bin/
RUN chmod a+x /usr/local/bin/*

ENTRYPOINT ["/usr/local/bin/php-entrypoint"]

CMD ["php-fpm"]
