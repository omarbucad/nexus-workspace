# ---------- Stage 1: Composer deps ----------
FROM composer:2 AS vendor
WORKDIR /app

RUN composer install \
  --no-dev \
  --prefer-dist \
  --no-interaction \
  --optimize-autoloader \
  --ignore-platform-req=ext-pcntl

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

WORKDIR /var/www

RUN apt-get update && apt-get install -y \
    curl \
    libzip-dev \
    libpng-dev \
    libpq-dev \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

RUN docker-php-ext-install pdo pdo_mysql pgsql pdo_pgsql gd bcmath zip sockets \
    && docker-php-ext-configure pcntl --enable-pcntl \
    && docker-php-ext-install pcntl \
    && pecl install redis \
    && docker-php-ext-enable redis

COPY --from=vendor /app /var/www
COPY --from=frontend /app/public/build /var/www/public/build

RUN chown -R www-data:www-data /var/www/storage /var/www/bootstrap/cache

COPY ./scripts/php-fpm-entrypoint /usr/local/bin/php-entrypoint
RUN chmod a+x /usr/local/bin/*

ENTRYPOINT ["/usr/local/bin/php-entrypoint"]
CMD ["php-fpm"]
