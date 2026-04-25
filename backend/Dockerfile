# ---------- Stage 1: Composer deps ----------
FROM composer:2 AS vendor
WORKDIR /usr/share/nginx/html

COPY . .
RUN composer install \
  --no-dev \
  --prefer-dist \
  --no-interaction \
  --optimize-autoloader \
  --ignore-platform-req=ext-pcntl


# ---------- Stage 2: Frontend build ----------

FROM node:20-alpine AS frontend
WORKDIR /app

# cache only npm deps
COPY package*.json ./
RUN npm ci

# copy ONLY frontend sources
COPY resources ./resources
COPY vite.config.* ./
COPY public ./public

RUN npm run build


# ---------- Stage 3: Runtime ----------
FROM php:8.4-fpm AS app

WORKDIR /usr/share/nginx/html

RUN apt-get update && apt-get install -y \
    curl \
    libzip-dev \
    libpng-dev \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

RUN docker-php-ext-install pdo pdo_mysql gd bcmath zip sockets \
    && docker-php-ext-configure pcntl --enable-pcntl \
    && docker-php-ext-install pcntl \
    && pecl install redis \
    && docker-php-ext-enable redis

COPY --from=vendor /usr/share/nginx/html /usr/share/nginx/html
COPY --from=frontend /app/public/build /usr/share/nginx/html/public/build

RUN chown -R www-data:www-data /usr/share/nginx/html/storage /usr/share/nginx/html/bootstrap/cache

COPY ./scripts/php-fpm-entrypoint /usr/local/bin/php-entrypoint
RUN chmod a+x /usr/local/bin/*

ENTRYPOINT ["/usr/local/bin/php-entrypoint"]
CMD ["php-fpm"]
