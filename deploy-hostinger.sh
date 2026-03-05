#!/bin/bash

# Sushi Queen - Deploy to Hostinger
# Domain: sushiqueen.galt.com.mx

set -e  # Exit on error

echo "🍣 Sushi Queen - Deploy to Hostinger"
echo "======================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# FTP Credentials
FTP_HOST="191.101.79.184"
FTP_USER="u716757676.galt.com.mx"
FTP_PASS="4Irbus0001!"
FTP_DIR="public_html"

# Check if lftp is installed
if ! command -v lftp &> /dev/null; then
    echo -e "${RED}❌ lftp is not installed${NC}"
    echo "Install it with: brew install lftp"
    exit 1
fi

# Step 1: Build Frontend
echo -e "${YELLOW}📦 Step 1: Building frontend...${NC}"
cd frontend
npm install
npm run build
cd ..
echo -e "${GREEN}✅ Frontend built${NC}"
echo ""

# Step 2: Prepare Backend
echo -e "${YELLOW}🔧 Step 2: Preparing backend...${NC}"

# Check if composer is installed
if command -v composer &> /dev/null; then
    echo "Installing backend dependencies..."
    cd backend
    composer install --no-dev --optimize-autoloader
    cd ..
    echo -e "${GREEN}✅ Backend dependencies installed${NC}"
else
    echo -e "${YELLOW}⚠️  Composer not found locally${NC}"
    echo "Dependencies will be installed on the server"
fi

echo -e "${GREEN}✅ Backend prepared${NC}"
echo ""

# Step 3: Create temporary upload directory
echo -e "${YELLOW}📁 Step 3: Preparing files for upload...${NC}"
rm -rf .deploy-temp
mkdir -p .deploy-temp

# Copy frontend build
cp -r frontend/dist/* .deploy-temp/

# Copy backend
mkdir -p .deploy-temp/api
cp -r backend/* .deploy-temp/api/
cp -r backend/.env.example .deploy-temp/api/.env.example

# Copy .htaccess
cp .htaccess .deploy-temp/

echo -e "${GREEN}✅ Files prepared${NC}"
echo ""

# Step 4: Upload via FTP
echo -e "${YELLOW}📤 Step 4: Uploading to Hostinger...${NC}"
echo "This may take a few minutes..."
echo ""

lftp -u ${FTP_USER},${FTP_PASS} ftp://${FTP_HOST} <<EOF
set ftp:ssl-allow no
set net:timeout 30
set net:max-retries 3

cd ${FTP_DIR}

# Upload frontend files
mirror -R --delete --verbose .deploy-temp/ ./

bye
EOF

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Files uploaded successfully${NC}"
else
    echo -e "${RED}❌ Upload failed${NC}"
    exit 1
fi
echo ""

# Step 5: Cleanup
echo -e "${YELLOW}🧹 Step 5: Cleaning up...${NC}"
rm -rf .deploy-temp
echo -e "${GREEN}✅ Cleanup done${NC}"
echo ""

# Final instructions
echo -e "${GREEN}======================================"
echo "✅ Deploy completed successfully!"
echo "======================================${NC}"
echo ""
echo "🌐 Your site: https://sushiqueen.galt.com.mx"
echo ""
echo -e "${YELLOW}⚠️  IMPORTANT NEXT STEPS:${NC}"
echo ""
echo "1. Configure .env on server:"
echo "   - Copy api/.env.example to api/.env"
echo "   - Set APP_KEY (run: php artisan key:generate)"
echo "   - Configure MongoDB Atlas connection"
echo "   - Set JWT_SECRET"
echo ""
echo "2. Set file permissions (via FTP or SSH):"
echo "   - chmod 775 api/storage -R"
echo "   - chmod 775 api/bootstrap/cache -R"
echo "   - chmod 600 api/.env"
echo ""
echo "3. Initialize database:"
echo "   - Run: php artisan migrate"
echo "   - Run: php artisan db:seed"
echo ""
echo "4. Configure Fudo webhooks:"
echo "   URL: https://sushiqueen.galt.com.mx/webhooks/fudo/order-confirmed"
echo ""
echo "5. Test the site:"
echo "   - Frontend: https://sushiqueen.galt.com.mx"
echo "   - API: https://sushiqueen.galt.com.mx/api/menu"
echo ""
echo -e "${GREEN}Happy deploying! 🚀${NC}"
