#!/usr/bin/env bash
# ============================================
# Sushi Queen - Main Deployment Script
# Usage: ./deploy/deploy.sh [--skip-build] [--skip-migrations]
# ============================================

set -euo pipefail

# ─── Configuration ───────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
COMPOSE_FILE="$PROJECT_DIR/docker-compose.prod.yml"
LOG_FILE="$PROJECT_DIR/deploy/logs/deploy-$(date +%Y%m%d-%H%M%S).log"
GITHUB_REPO="hackerjj"
BRANCH="${DEPLOY_BRANCH:-main}"
HEALTH_CHECK_URL="${HEALTH_CHECK_URL:-http://localhost/health}"
HEALTH_CHECK_RETRIES=30
HEALTH_CHECK_INTERVAL=5

# ─── Colors ──────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# ─── Flags ───────────────────────────────────
SKIP_BUILD=false
SKIP_MIGRATIONS=false

for arg in "$@"; do
    case $arg in
        --skip-build) SKIP_BUILD=true ;;
        --skip-migrations) SKIP_MIGRATIONS=true ;;
        *) echo -e "${RED}Unknown argument: $arg${NC}"; exit 1 ;;
    esac
done

# ─── Functions ───────────────────────────────
log() {
    local msg="[$(date '+%Y-%m-%d %H:%M:%S')] $1"
    echo -e "${BLUE}${msg}${NC}"
    echo "$msg" >> "$LOG_FILE"
}

success() {
    local msg="[$(date '+%Y-%m-%d %H:%M:%S')] ✅ $1"
    echo -e "${GREEN}${msg}${NC}"
    echo "$msg" >> "$LOG_FILE"
}

warn() {
    local msg="[$(date '+%Y-%m-%d %H:%M:%S')] ⚠️  $1"
    echo -e "${YELLOW}${msg}${NC}"
    echo "$msg" >> "$LOG_FILE"
}

error() {
    local msg="[$(date '+%Y-%m-%d %H:%M:%S')] ❌ $1"
    echo -e "${RED}${msg}${NC}"
    echo "$msg" >> "$LOG_FILE"
    exit 1
}

health_check() {
    log "Running health check on $HEALTH_CHECK_URL..."
    for i in $(seq 1 $HEALTH_CHECK_RETRIES); do
        if curl -sf "$HEALTH_CHECK_URL" > /dev/null 2>&1; then
            success "Health check passed (attempt $i/$HEALTH_CHECK_RETRIES)"
            return 0
        fi
        log "Health check attempt $i/$HEALTH_CHECK_RETRIES failed, retrying in ${HEALTH_CHECK_INTERVAL}s..."
        sleep $HEALTH_CHECK_INTERVAL
    done
    error "Health check failed after $HEALTH_CHECK_RETRIES attempts"
}

# ─── Pre-flight Checks ──────────────────────
mkdir -p "$PROJECT_DIR/deploy/logs"

log "=========================================="
log "🍣 Sushi Queen - Deployment Starting"
log "=========================================="
log "Branch: $BRANCH"
log "Skip build: $SKIP_BUILD"
log "Skip migrations: $SKIP_MIGRATIONS"

# Check required tools
for cmd in docker git curl; do
    if ! command -v $cmd &> /dev/null; then
        error "$cmd is not installed"
    fi
done

# Check docker compose
if docker compose version &> /dev/null; then
    DOCKER_COMPOSE="docker compose"
elif command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE="docker-compose"
else
    error "Docker Compose is not installed"
fi

# Check .env file
if [ ! -f "$PROJECT_DIR/.env" ]; then
    error ".env file not found. Run setup.sh first or copy from .env.example"
fi

# ─── Step 1: Pull Latest Code ───────────────
log "📥 Pulling latest code from GitHub ($BRANCH)..."
cd "$PROJECT_DIR"
git fetch origin "$BRANCH"
git checkout "$BRANCH"
git pull origin "$BRANCH"
success "Code updated to latest $BRANCH"

# ─── Step 2: Create Backup ──────────────────
log "💾 Creating pre-deployment backup..."
if [ -f "$SCRIPT_DIR/backup.sh" ]; then
    bash "$SCRIPT_DIR/backup.sh" --pre-deploy || warn "Backup failed, continuing deployment..."
else
    warn "backup.sh not found, skipping backup"
fi

# ─── Step 3: Build Docker Images ────────────
if [ "$SKIP_BUILD" = false ]; then
    log "🔨 Building Docker images..."
    $DOCKER_COMPOSE -f "$COMPOSE_FILE" build --no-cache --parallel
    success "Docker images built successfully"
else
    warn "Skipping Docker build (--skip-build flag)"
fi

# ─── Step 4: Stop Current Services ──────────
log "🛑 Stopping current services..."
$DOCKER_COMPOSE -f "$COMPOSE_FILE" down --remove-orphans
success "Services stopped"

# ─── Step 5: Start Services ─────────────────
log "🚀 Starting production services..."
$DOCKER_COMPOSE -f "$COMPOSE_FILE" up -d
success "Services started"

# ─── Step 6: Wait for Services ──────────────
log "⏳ Waiting for services to be ready..."
sleep 10

# ─── Step 7: Run Migrations ─────────────────
if [ "$SKIP_MIGRATIONS" = false ]; then
    log "🗄️  Running database migrations..."
    $DOCKER_COMPOSE -f "$COMPOSE_FILE" exec -T php-fpm php artisan migrate --force || warn "Migrations failed or not needed"
    success "Migrations completed"

    log "🌱 Running database seeders..."
    $DOCKER_COMPOSE -f "$COMPOSE_FILE" exec -T php-fpm php artisan db:seed --force || warn "Seeders failed or already run"
    success "Seeders completed"
else
    warn "Skipping migrations (--skip-migrations flag)"
fi

# ─── Step 8: Laravel Optimizations ──────────
log "⚡ Running Laravel optimizations..."
$DOCKER_COMPOSE -f "$COMPOSE_FILE" exec -T php-fpm php artisan config:cache || true
$DOCKER_COMPOSE -f "$COMPOSE_FILE" exec -T php-fpm php artisan route:cache || true
$DOCKER_COMPOSE -f "$COMPOSE_FILE" exec -T php-fpm php artisan view:cache || true
success "Laravel optimizations applied"

# ─── Step 9: Health Check ────────────────────
health_check

# ─── Step 10: Cleanup ───────────────────────
log "🧹 Cleaning up old Docker images..."
docker image prune -f || true

# ─── Done ────────────────────────────────────
success "=========================================="
success "🍣 Sushi Queen deployed successfully!"
success "=========================================="
log "Log file: $LOG_FILE"
