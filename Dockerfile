
# syntax=docker/dockerfile:1.6

############################
# 1) Build vendor + optimize
############################
FROM composer:2 AS vendor
WORKDIR /app

COPY composer.json composer.lock ./
RUN composer install \
  --no-dev \
  --no-interaction \
  --no-progress \
  --prefer-dist \
  --optimize-autoloader

############################
# 2) Final runtime image
############################
FROM php:8.3-fpm-alpine

ENV APP_ENV=production \
    APP_DEBUG=false \
    COMPOSER_ALLOW_SUPERUSER=1

RUN apk add --no-cache \
    nginx \
    supervisor \
    bash \
    curl \
    icu-dev \
    libzip-dev \
    oniguruma-dev \
    freetype-dev \
    libjpeg-turbo-dev \
    libpng-dev \
  && docker-php-ext-configure gd --with-freetype --with-jpeg \
  && docker-php-ext-install -j$(nproc) \
    pdo \
    pdo_mysql \
    intl \
    mbstring \
    zip \
    bcmath \
    gd \
    opcache \
  && apk add --no-cache --virtual .build-deps $PHPIZE_DEPS \
  && pecl install redis \
  && docker-php-ext-enable redis \
  && apk del .build-deps \
  && rm -rf /var/cache/apk/* /tmp/* /var/tmp/*

RUN addgroup -g 1000 -S www && adduser -u 1000 -S www -G www

RUN mkdir -p /run/nginx /var/lib/nginx /var/log/supervisor /var/www/html \
  && chown -R www:www /run/nginx /var/lib/nginx /var/log/supervisor /var/www/html

WORKDIR /var/www/html

COPY --chown=www:www . /var/www/html
COPY --from=vendor --chown=www:www /app/vendor /var/www/html/vendor

COPY --chown=www:www docker/nginx.conf /etc/nginx/http.d/default.conf
COPY --chown=www:www docker/supervisord.conf /etc/supervisord.conf
COPY --chown=www:www docker/php.ini $PHP_INI_DIR/conf.d/99-app.ini

RUN mkdir -p storage bootstrap/cache \
  && chown -R www:www storage bootstrap/cache \
  && chmod -R ug+rwx storage bootstrap/cache

USER www

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD curl -fsS http://127.0.0.1:8080/health || exit 1

CMD ["/usr/bin/supervisord", "-c", "/etc/supervisord.conf"]
