#!/bin/sh
set -e

echo "🍣 Sushi Queen Backend - Starting..."

# Run migrations
echo "Running migrations..."
php artisan migrate --force 2>&1 || echo "Migration warning (may be OK if already migrated)"

# Seed database
echo "Seeding database..."
php artisan db:seed --force 2>&1 || echo "Seed warning (may be OK if already seeded)"

# Start server
echo "Starting Laravel server on port ${PORT:-10000}..."
php artisan serve --host=0.0.0.0 --port=${PORT:-10000}
