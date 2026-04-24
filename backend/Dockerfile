# ---------- Stage 1: Build frontend assets (Node only here) ----------
FROM node:24-bookworm-slim AS node_builder
WORKDIR /app

# Cache npm install
COPY package.json package-lock.json* ./
RUN npm ci

# Build assets (Vite -> public/build)
COPY . .
RUN npm run build


# ---------- Stage 2: PHP runtime (no Node, no Postgres, no DB clients) ----------
FROM php:8.4-fpm

# Install system deps (keep it minimal + reliable)
# Note: libpng-dev already pulls the correct runtime lib; no need for libpng16-16.
RUN set -eux; \
    apt-get update; \
    apt-get install -y --no-install-recommends \
      curl \
      libzip-dev \
      libpng-dev \
    ; \
    rm -rf /var/lib/apt/lists/*

# PHP extensions (MySQL only)
RUN set -eux; \
    docker-php-ext-install pdo pdo_mysql gd bcmath zip sockets; \
    docker-php-ext-configure pcntl --enable-pcntl; \
    docker-php-ext-install pcntl; \
    pecl install redis; \
    docker-php-ext-enable redis

# Remove build deps to shrink image (keep runtime libs via dependencies)
RUN set -eux; \
    apt-get purge -y --auto-remove \
      libzip-dev \
      libpng-dev \
    ; \
    rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

# Composer
COPY --from=composer:latest /usr/bin/composer /usr/local/bin/composer
ENV COMPOSER_ALLOW_SUPERUSER=1

WORKDIR /usr/share/nginx/html

# Cache composer install
COPY composer.json composer.lock ./
RUN composer install --no-dev --optimize-autoloader --no-interaction --no-progress --prefer-dist \
  && composer clear-cache

# Copy app code
COPY . .

# Copy built frontend assets from Node stage
COPY --from=node_builder /app/public/build ./public/build

# Laravel setup + permissions (create dirs first, then permissions)
RUN set -eux; \
    mkdir -p storage/framework/sessions storage/framework/views storage/framework/cache bootstrap/cache; \
    php artisan package:discover --ansi; \
    chown -R www-data:www-data storage bootstrap/cache; \
    chmod -R 775 storage bootstrap/cache

# Entrypoint (paths relative to backend/ context)
COPY scripts/php-fpm-entrypoint /usr/local/bin/php-entrypoint
RUN chmod +x /usr/local/bin/php-entrypoint

ENTRYPOINT ["/usr/local/bin/php-entrypoint"]
CMD ["php-fpm"]
