#!/bin/sh
set -e

echo "🍣 Sushi Queen Backend - Starting..."

# Write runtime env vars to .env so Laravel can read them
echo "Writing .env from runtime environment..."
env | grep -E '^(APP_|DB_|MONGO_|REDIS_|JWT_|CORS_|FUDO_|WHATSAPP_|GOOGLE_|PORT|CACHE_|SESSION_|QUEUE_)' | while read line; do
    key=$(echo "$line" | cut -d= -f1)
    value=$(echo "$line" | cut -d= -f2-)
    echo "$key=$value"
done > .env

echo "DB_CONNECTION=mongodb" >> .env
echo "MONGO_DSN=${MONGO_URI}" >> .env

echo ".env written with $(wc -l < .env) variables"

# Clear any cached config
php artisan config:clear 2>/dev/null || true

# Run migrations
echo "Running migrations..."
php artisan migrate --force 2>&1 || echo "Migration warning (may be OK)"

# Seed database
echo "Seeding database..."
php artisan db:seed --force 2>&1 || echo "Seed warning (may be OK)"

# Start server
echo "Starting Laravel server on port ${PORT:-10000}..."
php artisan serve --host=0.0.0.0 --port=${PORT:-10000}
