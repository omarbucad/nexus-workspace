
# ---------- Stage 1: Build frontend assets (Node only here) ----------
FROM node:24-bookworm-slim AS node_builder
WORKDIR /app

# Cache npm install
COPY backend/package.json backend/package-lock.json* ./backend/
WORKDIR /app/backend
RUN npm ci

# Build assets
COPY backend/ ./
RUN npm run build


# ---------- Stage 2: PHP runtime (no Node, no Postgres, no DB clients) ----------
FROM php:8.4-fpm

# Minimal runtime libs + temporary build deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    libzip4 \
    libpng16-16 \
    libzip-dev \
    libpng-dev \
  && rm -rf /var/lib/apt/lists/*

# PHP extensions (MySQL only; no pgsql/pdo_pgsql)
RUN docker-php-ext-install pdo pdo_mysql gd bcmath zip sockets \
  && docker-php-ext-configure pcntl --enable-pcntl \
  && docker-php-ext-install pcntl \
  && pecl install redis \
  && docker-php-ext-enable redis

# Remove build deps to shrink image
RUN apt-get purge -y --auto-remove \
    libzip-dev libpng-dev \
  && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

# Composer
COPY --from=composer:latest /usr/bin/composer /usr/local/bin/composer
ENV COMPOSER_ALLOW_SUPERUSER=1

WORKDIR /usr/share/nginx/html

# Cache composer install
COPY backend/composer.json backend/composer.lock ./
RUN composer install --no-dev --optimize-autoloader --no-interaction --no-progress --prefer-dist \
  && composer clear-cache

# Copy app
COPY backend/ ./

# Copy built frontend assets
COPY --from=node_builder /app/backend/public/build ./public/build

# Laravel setup + permissions
RUN php artisan package:discover --ansi \
  && chmod -R 775 storage bootstrap/cache \
  && chown -R www-data:www-data storage bootstrap/cache \
  && mkdir -p storage/framework/{sessions,views,cache}

# Entrypoint
COPY ./scripts/php-fpm-entrypoint /usr/local/bin/php-entrypoint
RUN chmod a+x /usr/local/bin/*

ENTRYPOINT ["/usr/local/bin/php-entrypoint"]
CMD ["php-fpm"]
