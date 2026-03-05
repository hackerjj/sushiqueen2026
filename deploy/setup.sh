#!/usr/bin/env bash
# ============================================
# Sushi Queen - Initial Server Setup Script
# For Hostinger VPS (Ubuntu 22.04+)
# Usage: sudo ./deploy/setup.sh
# ============================================

set -euo pipefail

# ─── Configuration ───────────────────────────
DOMAIN="${DOMAIN:-sushiqueen.com}"
EMAIL="${CERTBOT_EMAIL:-admin@sushiqueen.com}"
PROJECT_DIR="/opt/sushi-queen"
GITHUB_REPO="hackerjj"
SWAP_SIZE="2G"

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

# ─── Root Check ──────────────────────────────
if [ "$EUID" -ne 0 ]; then
    error "Please run as root: sudo ./deploy/setup.sh"
fi

echo ""
echo "============================================"
echo "🍣 Sushi Queen - Server Setup"
echo "============================================"
echo "Domain: $DOMAIN"
echo "Email: $EMAIL"
echo "Project Dir: $PROJECT_DIR"
echo "============================================"
echo ""

# ─── Step 1: System Update ──────────────────
log "📦 Updating system packages..."
apt-get update -y
apt-get upgrade -y
apt-get install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg \
    lsb-release \
    software-properties-common \
    git \
    unzip \
    htop \
    fail2ban \
    ufw
success "System packages updated"

# ─── Step 2: Create Swap (if not exists) ────
if [ ! -f /swapfile ]; then
    log "💾 Creating ${SWAP_SIZE} swap file..."
    fallocate -l $SWAP_SIZE /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
    success "Swap file created"
else
    warn "Swap file already exists, skipping"
fi

# ─── Step 3: Install Docker ─────────────────
if ! command -v docker &> /dev/null; then
    log "🐳 Installing Docker..."
    curl -fsSL https://get.docker.com | sh
    systemctl enable docker
    systemctl start docker
    success "Docker installed"
else
    warn "Docker already installed: $(docker --version)"
fi

# ─── Step 4: Install Docker Compose ─────────
if ! docker compose version &> /dev/null; then
    log "🐳 Installing Docker Compose plugin..."
    apt-get install -y docker-compose-plugin
    success "Docker Compose installed"
else
    warn "Docker Compose already installed: $(docker compose version)"
fi

# ─── Step 5: Configure Firewall ─────────────
log "🔥 Configuring UFW firewall..."
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
success "Firewall configured (SSH, HTTP, HTTPS allowed)"

# ─── Step 6: Configure Fail2Ban ─────────────
log "🛡️  Configuring Fail2Ban..."
cat > /etc/fail2ban/jail.local << 'EOF'
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
bantime = 7200
EOF

systemctl enable fail2ban
systemctl restart fail2ban
success "Fail2Ban configured"

# ─── Step 7: Clone Repository ───────────────
if [ ! -d "$PROJECT_DIR" ]; then
    log "📥 Cloning repository..."
    git clone "https://github.com/${GITHUB_REPO}/sushi-queen.git" "$PROJECT_DIR" || \
    git clone "git@github.com:${GITHUB_REPO}/sushi-queen.git" "$PROJECT_DIR"
    success "Repository cloned to $PROJECT_DIR"
else
    warn "Project directory already exists at $PROJECT_DIR"
    cd "$PROJECT_DIR"
    git pull origin main || true
fi

cd "$PROJECT_DIR"

# ─── Step 8: Create .env File ───────────────
if [ ! -f "$PROJECT_DIR/.env" ]; then
    log "📝 Creating .env file from template..."
    cp .env.example .env

    # Generate random passwords
    MONGO_PASS=$(openssl rand -base64 24 | tr -dc 'a-zA-Z0-9' | head -c 32)
    REDIS_PASS=$(openssl rand -base64 24 | tr -dc 'a-zA-Z0-9' | head -c 32)
    JWT_SECRET=$(openssl rand -base64 48 | tr -dc 'a-zA-Z0-9' | head -c 64)
    APP_KEY="base64:$(openssl rand -base64 32)"

    # Update .env with production values
    sed -i "s|APP_ENV=local|APP_ENV=production|g" .env
    sed -i "s|APP_DEBUG=true|APP_DEBUG=false|g" .env
    sed -i "s|APP_URL=http://localhost|APP_URL=https://${DOMAIN}|g" .env
    sed -i "s|APP_KEY=|APP_KEY=${APP_KEY}|g" .env
    sed -i "s|MONGO_PASSWORD=sushiqueen_secret|MONGO_PASSWORD=${MONGO_PASS}|g" .env
    sed -i "s|REDIS_PASSWORD=sushiqueen_redis|REDIS_PASSWORD=${REDIS_PASS}|g" .env
    sed -i "s|JWT_SECRET=|JWT_SECRET=${JWT_SECRET}|g" .env
    sed -i "s|VITE_API_URL=http://localhost/api|VITE_API_URL=https://${DOMAIN}/api|g" .env
    sed -i "s|CORS_ALLOWED_ORIGINS=.*|CORS_ALLOWED_ORIGINS=https://${DOMAIN}|g" .env

    success ".env file created with secure passwords"
    warn "⚠️  IMPORTANT: Edit .env to add your API keys (WhatsApp, Fudo, Google AI, etc.)"
else
    warn ".env file already exists, skipping"
fi

# ─── Step 9: Create Required Directories ────
log "📁 Creating required directories..."
mkdir -p "$PROJECT_DIR/certbot/conf"
mkdir -p "$PROJECT_DIR/certbot/www"
mkdir -p "$PROJECT_DIR/deploy/logs"
mkdir -p "$PROJECT_DIR/backups"
success "Directories created"

# ─── Step 10: Setup SSL with Certbot ────────
log "🔒 Setting up SSL certificate..."

# First, start nginx without SSL for ACME challenge
# Create a temporary nginx config for initial cert
cat > "$PROJECT_DIR/nginx/production.conf.tmp" << 'NGINX_TMP'
server {
    listen 80;
    server_name _;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 200 'Setting up SSL...';
        add_header Content-Type text/plain;
    }
}
NGINX_TMP

# Start temporary nginx for cert generation
docker run -d --name certbot-nginx \
    -p 80:80 \
    -v "$PROJECT_DIR/nginx/production.conf.tmp:/etc/nginx/conf.d/default.conf:ro" \
    -v "$PROJECT_DIR/certbot/www:/var/www/certbot" \
    nginx:1.25-alpine || true

sleep 3

# Request certificate
docker run --rm \
    -v "$PROJECT_DIR/certbot/conf:/etc/letsencrypt" \
    -v "$PROJECT_DIR/certbot/www:/var/www/certbot" \
    certbot/certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email "$EMAIL" \
    --agree-tos \
    --no-eff-email \
    -d "$DOMAIN" \
    -d "www.$DOMAIN" || warn "SSL certificate request failed. You can retry manually later."

# Stop temporary nginx
docker stop certbot-nginx 2>/dev/null || true
docker rm certbot-nginx 2>/dev/null || true
rm -f "$PROJECT_DIR/nginx/production.conf.tmp"

success "SSL setup completed"

# ─── Step 11: Setup Cron Jobs ───────────────
log "⏰ Setting up cron jobs..."

# SSL renewal cron
(crontab -l 2>/dev/null; echo "0 3 * * * cd $PROJECT_DIR && docker compose -f docker-compose.prod.yml run --rm certbot renew && docker compose -f docker-compose.prod.yml exec nginx nginx -s reload") | crontab -

# Daily backup cron
(crontab -l 2>/dev/null; echo "0 2 * * * $PROJECT_DIR/deploy/backup.sh >> $PROJECT_DIR/deploy/logs/backup.log 2>&1") | crontab -

success "Cron jobs configured (SSL renewal + daily backup)"

# ─── Step 12: Set Permissions ───────────────
log "🔐 Setting file permissions..."
chmod +x "$PROJECT_DIR/deploy/"*.sh
chown -R root:docker "$PROJECT_DIR"
success "Permissions set"

# ─── Done ────────────────────────────────────
echo ""
echo "============================================"
success "🍣 Sushi Queen - Server Setup Complete!"
echo "============================================"
echo ""
echo "Next steps:"
echo "  1. Edit .env file: nano $PROJECT_DIR/.env"
echo "  2. Update nginx/production.conf with your domain"
echo "  3. Deploy: cd $PROJECT_DIR && ./deploy/deploy.sh"
echo ""
echo "============================================"
