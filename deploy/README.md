# 🍣 Sushi Queen - Deployment Guide

## Table of Contents

- [Prerequisites](#prerequisites)
- [Architecture Overview](#architecture-overview)
- [Initial Setup (Hostinger VPS)](#initial-setup-hostinger-vps)
- [Deployment Process](#deployment-process)
- [Environment Variables](#environment-variables)
- [SSL/TLS Setup](#ssltls-setup)
- [Backups](#backups)
- [Monitoring](#monitoring)
- [Troubleshooting](#troubleshooting)
- [AWS Migration Guide](#aws-migration-guide)

---

## Prerequisites

### Hostinger VPS (Current)

- Ubuntu 22.04+ VPS (minimum 2GB RAM, 2 vCPU)
- Domain name pointing to VPS IP
- SSH access with root/sudo privileges
- GitHub repository access

### Local Development

- Docker & Docker Compose v2+
- Git
- Node.js 20+ (for frontend development)
- PHP 8.2+ (for backend development)

---

## Architecture Overview

```
┌─────────────────────────────────────────────┐
│                   Nginx                      │
│          (SSL termination, proxy)            │
│              Port 80/443                     │
├──────────────────┬──────────────────────────┤
│                  │                           │
│   /api/*         │        /*                 │
│   /webhooks/*    │     (SPA assets)          │
│                  │                           │
│  ┌───────────┐   │   ┌──────────────┐       │
│  │  PHP-FPM  │   │   │   Frontend   │       │
│  │  Laravel  │   │   │  React+Nginx │       │
│  │  :9000    │   │   │    :80       │       │
│  └─────┬─────┘   │   └──────────────┘       │
│        │         │                           │
│  ┌─────┴─────┐  ┌┴──────────┐               │
│  │  MongoDB  │  │   Redis   │               │
│  │  :27017   │  │   :6379   │               │
│  └───────────┘  └───────────┘               │
└─────────────────────────────────────────────┘
```

---

## Initial Setup (Hostinger VPS)

### 1. Connect to your VPS

```bash
ssh root@your-vps-ip
```

### 2. Run the setup script

```bash
# Clone the repo first (or upload setup.sh)
git clone https://github.com/hackerjj/sushi-queen.git /opt/sushi-queen
cd /opt/sushi-queen

# Set your domain and email
export DOMAIN="sushiqueen.com"
export CERTBOT_EMAIL="admin@sushiqueen.com"

# Run setup
sudo ./deploy/setup.sh
```

The setup script will:
- Update system packages
- Install Docker & Docker Compose
- Configure UFW firewall (SSH, HTTP, HTTPS)
- Configure Fail2Ban for SSH protection
- Clone the repository
- Generate secure passwords in `.env`
- Request SSL certificate via Let's Encrypt
- Setup cron jobs for SSL renewal and daily backups

### 3. Configure environment variables

```bash
nano /opt/sushi-queen/.env
```

Add your API keys:
- WhatsApp Business API credentials
- Fudo POS credentials
- Google AI (Gemini) API key
- Facebook Pixel ID
- Google Analytics ID

### 4. Update Nginx config

Edit `nginx/production.conf` and replace `sushiqueen.com` with your actual domain in the SSL certificate paths.

### 5. Deploy

```bash
./deploy/deploy.sh
```

---

## Deployment Process

### Standard Deployment

```bash
cd /opt/sushi-queen
./deploy/deploy.sh
```

This will:
1. Pull latest code from GitHub (main branch)
2. Create a pre-deployment backup
3. Build Docker images
4. Stop current services
5. Start new services
6. Run database migrations and seeders
7. Cache Laravel config/routes/views
8. Run health checks
9. Clean up old Docker images

### Deployment Options

```bash
# Skip Docker image rebuild (code-only changes)
./deploy/deploy.sh --skip-build

# Skip database migrations
./deploy/deploy.sh --skip-migrations

# Deploy a specific branch
DEPLOY_BRANCH=staging ./deploy/deploy.sh
```

### Manual Docker Commands

```bash
# View running services
docker compose -f docker-compose.prod.yml ps

# View logs
docker compose -f docker-compose.prod.yml logs -f php-fpm
docker compose -f docker-compose.prod.yml logs -f nginx

# Restart a specific service
docker compose -f docker-compose.prod.yml restart php-fpm

# Run artisan commands
docker compose -f docker-compose.prod.yml exec php-fpm php artisan migrate
docker compose -f docker-compose.prod.yml exec php-fpm php artisan tinker

# Access MongoDB shell
docker compose -f docker-compose.prod.yml exec mongodb mongosh -u sushiqueen -p
```

---

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `APP_ENV` | Environment (production) | Yes |
| `APP_KEY` | Laravel app key | Yes |
| `APP_DEBUG` | Debug mode (false in prod) | Yes |
| `APP_URL` | Application URL | Yes |
| `MONGO_HOST` | MongoDB host | Yes |
| `MONGO_PORT` | MongoDB port (27017) | Yes |
| `MONGO_DATABASE` | Database name | Yes |
| `MONGO_USERNAME` | MongoDB username | Yes |
| `MONGO_PASSWORD` | MongoDB password | Yes |
| `REDIS_HOST` | Redis host | Yes |
| `REDIS_PASSWORD` | Redis password | Yes |
| `JWT_SECRET` | JWT signing secret | Yes |
| `FUDO_CLIENT_ID` | Fudo POS client ID | Yes |
| `FUDO_CLIENT_SECRET` | Fudo POS client secret | Yes |
| `FUDO_API_URL` | Fudo API URL | Yes |
| `WHATSAPP_PHONE_NUMBER_ID` | WhatsApp phone ID | Optional |
| `WHATSAPP_ACCESS_TOKEN` | WhatsApp API token | Optional |
| `GOOGLE_AI_API_KEY` | Gemini API key | Optional |
| `VITE_API_URL` | Frontend API URL | Yes |
| `VITE_FB_PIXEL_ID` | Facebook Pixel ID | Optional |
| `VITE_GA_ID` | Google Analytics ID | Optional |
| `VITE_GTM_ID` | Google Tag Manager ID | Optional |

---

## SSL/TLS Setup

SSL is managed by Certbot (Let's Encrypt) with automatic renewal.

### Manual Certificate Renewal

```bash
docker compose -f docker-compose.prod.yml run --rm certbot renew
docker compose -f docker-compose.prod.yml exec nginx nginx -s reload
```

### Check Certificate Status

```bash
docker compose -f docker-compose.prod.yml run --rm certbot certificates
```

---

## Backups

### Automatic Backups

Daily backups run at 2:00 AM via cron. Backups are stored in `/opt/sushi-queen/backups/`.

### Manual Backup

```bash
./deploy/backup.sh
```

### Pre-Deployment Backup

Automatically created before each deployment. Can also be triggered manually:

```bash
./deploy/backup.sh --pre-deploy
```

### Restore from Backup

```bash
# Restore MongoDB
docker compose -f docker-compose.prod.yml exec -T mongodb mongorestore \
  --username=sushiqueen \
  --password=YOUR_PASSWORD \
  --authenticationDatabase=admin \
  --db=sushi_queen \
  --archive --gzip < backups/scheduled/mongodb-scheduled-YYYYMMDD-HHMMSS.gz
```

### Backup Retention

Backups older than 30 days are automatically deleted. Configure with `BACKUP_RETENTION_DAYS` environment variable.

---

## Monitoring

### Health Check

```bash
curl -f http://localhost/health
```

### Docker Service Status

```bash
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml stats
```

### Logs

```bash
# All services
docker compose -f docker-compose.prod.yml logs -f --tail=100

# Specific service
docker compose -f docker-compose.prod.yml logs -f php-fpm
docker compose -f docker-compose.prod.yml logs -f nginx
docker compose -f docker-compose.prod.yml logs -f mongodb
```

---

## Troubleshooting

### Services won't start

```bash
# Check Docker status
systemctl status docker

# Check compose config
docker compose -f docker-compose.prod.yml config

# Check individual service logs
docker compose -f docker-compose.prod.yml logs php-fpm
```

### 502 Bad Gateway

- PHP-FPM may not be running: `docker compose -f docker-compose.prod.yml restart php-fpm`
- Check PHP-FPM logs: `docker compose -f docker-compose.prod.yml logs php-fpm`

### MongoDB Connection Issues

```bash
# Check MongoDB is running
docker compose -f docker-compose.prod.yml exec mongodb mongosh --eval "db.adminCommand('ping')"

# Check credentials in .env match docker-compose
grep MONGO .env
```

### SSL Certificate Issues

```bash
# Check certificate files exist
ls -la certbot/conf/live/sushiqueen.com/

# Request new certificate
docker run --rm -v ./certbot/conf:/etc/letsencrypt -v ./certbot/www:/var/www/certbot \
  certbot/certbot certonly --webroot --webroot-path=/var/www/certbot \
  --email admin@sushiqueen.com --agree-tos -d sushiqueen.com
```

### Disk Space Issues

```bash
# Check disk usage
df -h

# Clean Docker resources
docker system prune -af
docker volume prune -f
```

### Permission Issues

```bash
# Fix Laravel storage permissions
docker compose -f docker-compose.prod.yml exec php-fpm chmod -R 775 storage bootstrap/cache
docker compose -f docker-compose.prod.yml exec php-fpm chown -R www-data:www-data storage bootstrap/cache
```

---

## AWS Migration Guide

The `terraform/` directory contains infrastructure-as-code for migrating to AWS.

### Architecture on AWS

```
CloudFront (CDN)
    ├── S3 (Static Assets / Frontend)
    └── ALB (Application Load Balancer)
         ├── ECS Fargate (Backend - PHP-FPM)
         └── ECS Fargate (Frontend - Nginx)
              ├── DocumentDB (MongoDB compatible)
              └── ElastiCache (Redis)
```

### Migration Steps

1. **Prerequisites**
   ```bash
   # Install Terraform
   brew install terraform  # macOS
   
   # Configure AWS CLI
   aws configure
   ```

2. **Create S3 backend for Terraform state**
   ```bash
   aws s3 mb s3://sushi-queen-terraform-state
   aws dynamodb create-table \
     --table-name sushi-queen-terraform-locks \
     --attribute-definitions AttributeName=LockID,AttributeType=S \
     --key-schema AttributeName=LockID,KeyType=HASH \
     --billing-mode PAY_PER_REQUEST
   ```

3. **Create ECR repositories**
   ```bash
   aws ecr create-repository --repository-name sushi-queen/backend
   aws ecr create-repository --repository-name sushi-queen/frontend
   ```

4. **Request ACM certificate**
   ```bash
   aws acm request-certificate \
     --domain-name sushiqueen.com \
     --subject-alternative-names "*.sushiqueen.com" \
     --validation-method DNS
   ```

5. **Create terraform.tfvars**
   ```hcl
   aws_region          = "us-east-1"
   environment         = "production"
   docdb_password      = "your-secure-password"
   acm_certificate_arn = "arn:aws:acm:us-east-1:ACCOUNT:certificate/CERT-ID"
   ecr_repository_url  = "ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/sushi-queen"
   domain_name         = "sushiqueen.com"
   ```

6. **Deploy infrastructure**
   ```bash
   cd terraform
   terraform init
   terraform plan
   terraform apply
   ```

7. **Push Docker images to ECR**
   ```bash
   aws ecr get-login-password | docker login --username AWS --password-stdin ACCOUNT.dkr.ecr.us-east-1.amazonaws.com
   
   docker build -f backend/Dockerfile.prod -t sushi-queen/backend ./backend
   docker tag sushi-queen/backend:latest ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/sushi-queen/backend:latest
   docker push ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/sushi-queen/backend:latest
   
   docker build -f frontend/Dockerfile.prod -t sushi-queen/frontend ./frontend
   docker tag sushi-queen/frontend:latest ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/sushi-queen/frontend:latest
   docker push ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/sushi-queen/frontend:latest
   ```

8. **Migrate data**
   - Export MongoDB data from Hostinger
   - Import into DocumentDB
   - Update DNS records to point to CloudFront

### Estimated AWS Costs (Monthly)

| Service | Spec | Est. Cost |
|---------|------|-----------|
| ECS Fargate (2 tasks) | 0.5 vCPU, 1GB | ~$30 |
| DocumentDB | db.t3.medium | ~$60 |
| ElastiCache | cache.t3.micro | ~$15 |
| ALB | Standard | ~$20 |
| S3 + CloudFront | Standard | ~$5 |
| NAT Gateway | Standard | ~$35 |
| **Total** | | **~$165/mo** |

> Costs can be reduced using Reserved Instances, Savings Plans, or FARGATE_SPOT.
