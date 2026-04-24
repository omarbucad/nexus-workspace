# ---------- Stage 1: Build frontend assets (Node only here) ----------
FROM node:24-alpine AS node_builder
WORKDIR /app

# Workaround for rolldown native binding issues in some environments
ENV NAPI_RS_FORCE_WASI=1

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .
RUN npm run build


# ---------- Stage 2: PHP runtime (no Node, no Postgres, no DB clients) ----------
FROM php:8.4-fpm

RUN set -eux; \
    apt-get update; \
    apt-get install -y --no-install-recommends \
      curl \
      libzip-dev \
      libpng-dev \
    ; \
    rm -rf /var/lib/apt/lists/*

RUN set -eux; \
    docker-php-ext-install pdo pdo_mysql gd bcmath zip sockets; \
    docker-php-ext-configure pcntl --enable-pcntl; \
    docker-php-ext-install pcntl; \
    pecl install redis; \
    docker-php-ext-enable redis

RUN set -eux; \
    apt-get purge -y --auto-remove libzip-dev libpng-dev; \
    rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

COPY --from=composer:latest /usr/bin/composer /usr/local/bin/composer
ENV COMPOSER_ALLOW_SUPERUSER=1

WORKDIR /usr/share/nginx/html

COPY composer.json composer.lock ./
RUN composer install --no-dev --optimize-autoloader --no-interaction --no-progress --prefer-dist \
  && composer clear-cache

COPY . .

COPY --from=node_builder /app/public/build ./public/build

RUN set -eux; \
    mkdir -p storage/framework/{sessions,views,cache} bootstrap/cache; \
    php artisan package:discover --ansi; \
    chown -R www-data:www-data storage bootstrap/cache; \
    chmod -R 775 storage bootstrap/cache

COPY scripts/php-fpm-entrypoint /usr/local/bin/php-entrypoint
RUN chmod +x /usr/local/bin/php-entrypoint

ENTRYPOINT ["/usr/local/bin/php-entrypoint"]
CMD ["php-fpm"]
