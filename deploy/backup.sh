#!/usr/bin/env bash
# ============================================
# Sushi Queen - Database Backup Script
# Usage: ./deploy/backup.sh [--pre-deploy]
# ============================================

set -euo pipefail

# ─── Configuration ───────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="${BACKUP_DIR:-$PROJECT_DIR/backups}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
COMPOSE_FILE="$PROJECT_DIR/docker-compose.prod.yml"

# Load environment variables
if [ -f "$PROJECT_DIR/.env" ]; then
    set -a
    source "$PROJECT_DIR/.env"
    set +a
fi

MONGO_DB="${MONGO_DATABASE:-sushi_queen}"
MONGO_USER="${MONGO_USERNAME:-sushiqueen}"
MONGO_PASS="${MONGO_PASSWORD:-}"

# ─── Colors ──────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() { echo -e "${BLUE}[$(date '+%H:%M:%S')] $1${NC}"; }
success() { echo -e "${GREEN}[$(date '+%H:%M:%S')] ✅ $1${NC}"; }
warn() { echo -e "${YELLOW}[$(date '+%H:%M:%S')] ⚠️  $1${NC}"; }
error() { echo -e "${RED}[$(date '+%H:%M:%S')] ❌ $1${NC}"; exit 1; }

# ─── Flags ───────────────────────────────────
IS_PRE_DEPLOY=false
for arg in "$@"; do
    case $arg in
        --pre-deploy) IS_PRE_DEPLOY=true ;;
    esac
done

# ─── Setup ───────────────────────────────────
if [ "$IS_PRE_DEPLOY" = true ]; then
    BACKUP_SUBDIR="$BACKUP_DIR/pre-deploy"
    BACKUP_PREFIX="pre-deploy"
else
    BACKUP_SUBDIR="$BACKUP_DIR/scheduled"
    BACKUP_PREFIX="scheduled"
fi

mkdir -p "$BACKUP_SUBDIR"

log "=========================================="
log "🍣 Sushi Queen - Database Backup"
log "=========================================="
log "Type: $BACKUP_PREFIX"
log "Database: $MONGO_DB"
log "Backup dir: $BACKUP_SUBDIR"

# ─── Check Docker Compose ───────────────────
if docker compose version &> /dev/null; then
    DOCKER_COMPOSE="docker compose"
elif command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE="docker-compose"
else
    error "Docker Compose is not installed"
fi

# ─── MongoDB Backup ─────────────────────────
MONGO_BACKUP_FILE="$BACKUP_SUBDIR/mongodb-${BACKUP_PREFIX}-${TIMESTAMP}.gz"

log "📦 Backing up MongoDB..."

$DOCKER_COMPOSE -f "$COMPOSE_FILE" exec -T mongodb mongodump \
    --username="$MONGO_USER" \
    --password="$MONGO_PASS" \
    --authenticationDatabase=admin \
    --db="$MONGO_DB" \
    --archive \
    --gzip | cat > "$MONGO_BACKUP_FILE"

if [ -s "$MONGO_BACKUP_FILE" ]; then
    MONGO_SIZE=$(du -h "$MONGO_BACKUP_FILE" | cut -f1)
    success "MongoDB backup created: $MONGO_BACKUP_FILE ($MONGO_SIZE)"
else
    rm -f "$MONGO_BACKUP_FILE"
    error "MongoDB backup failed - empty file"
fi

# ─── Redis Backup ────────────────────────────
REDIS_BACKUP_FILE="$BACKUP_SUBDIR/redis-${BACKUP_PREFIX}-${TIMESTAMP}.rdb"

log "📦 Backing up Redis..."

$DOCKER_COMPOSE -f "$COMPOSE_FILE" exec -T redis redis-cli \
    -a "$REDIS_PASS" BGSAVE > /dev/null 2>&1 || true

sleep 2

# Copy the RDB file from the container
$DOCKER_COMPOSE -f "$COMPOSE_FILE" cp \
    redis:/data/dump.rdb "$REDIS_BACKUP_FILE" 2>/dev/null || warn "Redis backup skipped (no data)"

if [ -f "$REDIS_BACKUP_FILE" ] && [ -s "$REDIS_BACKUP_FILE" ]; then
    REDIS_SIZE=$(du -h "$REDIS_BACKUP_FILE" | cut -f1)
    success "Redis backup created: $REDIS_BACKUP_FILE ($REDIS_SIZE)"
else
    warn "Redis backup not available"
fi

# ─── Backup .env File ───────────────────────
ENV_BACKUP_FILE="$BACKUP_SUBDIR/env-${BACKUP_PREFIX}-${TIMESTAMP}.enc"

log "📦 Backing up .env file..."
if [ -f "$PROJECT_DIR/.env" ]; then
    cp "$PROJECT_DIR/.env" "$ENV_BACKUP_FILE"
    chmod 600 "$ENV_BACKUP_FILE"
    success ".env backup created"
else
    warn ".env file not found"
fi

# ─── Cleanup Old Backups ────────────────────
log "🧹 Cleaning up backups older than ${RETENTION_DAYS} days..."
DELETED_COUNT=$(find "$BACKUP_DIR" -type f -mtime +$RETENTION_DAYS -delete -print | wc -l)
if [ "$DELETED_COUNT" -gt 0 ]; then
    success "Deleted $DELETED_COUNT old backup files"
else
    log "No old backups to clean up"
fi

# ─── Summary ─────────────────────────────────
TOTAL_SIZE=$(du -sh "$BACKUP_SUBDIR" 2>/dev/null | cut -f1)

echo ""
success "=========================================="
success "🍣 Backup completed!"
success "Total backup size: $TOTAL_SIZE"
success "Location: $BACKUP_SUBDIR"
success "=========================================="
