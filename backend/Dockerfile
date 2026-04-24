
# ---------- Stage 1: Composer deps ----------
FROM composer:2 AS vendor
WORKDIR /usr/share/nginx/html

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

# ---------- Stage 3: Runtime (MySQL only) ----------
FROM php:8.4-fpm-alpine
WORKDIR /usr/share/nginx/html

# System deps for PHP extensions
RUN apk add --no-cache \
    bash \
    curl \
    libzip-dev zip \
    oniguruma-dev \
    freetype-dev \
    libpng-dev \
    libjpeg-turbo-dev \
    mariadb-connector-c-dev \
    $PHPIZE_DEPS

# PHP extensions
RUN docker-php-ext-configure gd --with-freetype --with-jpeg \
 && docker-php-ext-install -j$(nproc) \
    pdo \
    pdo_mysql \
    gd \
    bcmath \
    zip \
    sockets \
    pcntl \
 && pecl install redis \
 && docker-php-ext-enable redis \
 && apk del $PHPIZE_DEPS

# App source
COPY . .

# Vendor + built assets
COPY --from=vendor /usr/share/nginx/html/vendor ./vendor
COPY --from=frontend /app/public/build ./public/build

# Permissions
RUN chown -R www-data:www-data storage bootstrap/cache

COPY ./scripts/php-fpm-entrypoint /usr/local/bin/php-entrypoint
RUN chmod +x /usr/local/bin/php-entrypoint

ENTRYPOINT ["/usr/local/bin/php-entrypoint"]
CMD ["php-fpm"]
