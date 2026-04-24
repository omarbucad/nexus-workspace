# syntax=docker/dockerfile:1

FROM php:8.4-fpm-alpine AS php-builder

RUN apk add --no-cache \
    $PHPIZE_DEPS \
    curl \
    git \
    unzip \
    libzip-dev \
    libpng-dev \
    postgresql-dev \
    zlib-dev \
    oniguruma-dev \
    linux-headers \
    && docker-php-ext-install pdo pdo_mysql pgsql pdo_pgsql gd bcmath zip sockets pcntl \
    && pecl install redis \
    && docker-php-ext-enable redis \
    && apk del $PHPIZE_DEPS

WORKDIR /app

COPY composer.json composer.lock ./
COPY --from=composer:latest /usr/bin/composer /usr/local/bin/composer

RUN composer install --no-dev --optimize-autoloader --no-scripts --no-interaction --prefer-dist

COPY . .
RUN php artisan package:discover --ansi


FROM node:24-alpine AS frontend-builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build


FROM php:8.4-fpm-alpine AS runtime

RUN apk add --no-cache \
    libzip \
    libpng \
    postgresql-libs \
    icu-libs \
    oniguruma \
    && addgroup -g 1000 app \
    && adduser -D -G app -u 1000 app

WORKDIR /usr/share/nginx/html

COPY --from=php-builder /usr/local/lib/php/extensions/ /usr/local/lib/php/extensions/
COPY --from=php-builder /usr/local/etc/php/conf.d/ /usr/local/etc/php/conf.d/
COPY --from=php-builder /app /usr/share/nginx/html
COPY --from=frontend-builder /app/public/build /usr/share/nginx/html/public/build
COPY ./scripts/php-fpm-entrypoint /usr/local/bin/php-entrypoint

RUN sed -i 's/\r$//' /usr/local/bin/php-entrypoint && chmod +x /usr/local/bin/php-entrypoint \
    && mkdir -p storage/framework/sessions storage/framework/views storage/framework/cache \
    && chown -R app:app /usr/share/nginx/html

USER app

ENTRYPOINT ["/usr/local/bin/php-entrypoint"]
CMD ["php-fpm"]
