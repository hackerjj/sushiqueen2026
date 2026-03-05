# Sushi Queen - Serverless Deployment Guide

Deploy without Docker using serverless architecture - similar to Valoria project.

## Architecture

- **Frontend**: Vercel or AWS Amplify (Free tier)
- **Backend**: AWS Lambda + API Gateway (Serverless)
- **Database**: MongoDB Atlas (Free tier - 512MB)
- **Cache**: Upstash Redis (Free tier - 10K requests/day)
- **Storage**: AWS S3 (Pay as you go, very cheap)

## Cost Estimate
- **Free tier**: ~$0-5/month for low traffic
- **Production**: ~$10-30/month for moderate traffic

---

## Option 1: Vercel (Easiest - Recommended)

### Frontend Deployment

1. **Install Vercel CLI**
```bash
npm i -g vercel
```

2. **Deploy Frontend**
```bash
cd frontend
vercel --prod
```

3. **Set Environment Variables** (in Vercel dashboard)
```
VITE_API_URL=https://your-api-url.execute-api.us-east-1.amazonaws.com/prod
```

### Backend Deployment (AWS Lambda)

1. **Install Serverless Framework**
```bash
npm install -g serverless
```

2. **Install Bref (PHP on Lambda)**
```bash
cd backend
composer require bref/bref
```

3. **Configure AWS Credentials**
```bash
aws configure
# Enter your AWS Access Key ID
# Enter your AWS Secret Access Key
# Region: us-east-1
```

4. **Deploy Backend**
```bash
serverless deploy --stage prod
```

5. **Note the API Gateway URL** and update Vercel env vars

---

## Option 2: AWS Amplify (All AWS)

### 1. Setup Amplify

```bash
npm install -g @aws-amplify/cli
amplify configure
```

### 2. Initialize Amplify

```bash
amplify init
# Follow prompts
```

### 3. Deploy Frontend

```bash
amplify add hosting
amplify publish
```

### 4. Deploy Backend (same as above)
Use serverless framework for Lambda deployment

---

## Database Setup (MongoDB Atlas - Free)

1. **Create Account**: https://www.mongodb.com/cloud/atlas/register

2. **Create Free Cluster**
   - Choose AWS
   - Region: us-east-1
   - Tier: M0 (Free)

3. **Create Database User**
   - Username: sushiqueen
   - Password: (generate strong password)

4. **Whitelist IP**
   - Add: 0.0.0.0/0 (allow from anywhere)

5. **Get Connection String**
```
mongodb+srv://sushiqueen:<password>@cluster0.xxxxx.mongodb.net/sushi_queen?retryWrites=true&w=majority
```

6. **Add to Environment Variables**
```bash
# For Serverless
export MONGO_URI="mongodb+srv://..."

# For Vercel (in dashboard)
MONGO_URI=mongodb+srv://...
```

---

## Cache Setup (Upstash Redis - Free)

1. **Create Account**: https://upstash.com/

2. **Create Redis Database**
   - Region: us-east-1
   - Type: Regional

3. **Get Connection URL**
```
redis://default:<password>@<endpoint>:6379
```

4. **Add to Environment Variables**
```bash
export REDIS_URL="redis://..."
```

---

## Environment Variables

Create `.env.production` in backend:

```bash
APP_ENV=production
APP_DEBUG=false
APP_URL=https://your-domain.vercel.app

# MongoDB Atlas
MONGO_URI=mongodb+srv://sushiqueen:<password>@cluster0.xxxxx.mongodb.net/sushi_queen

# Upstash Redis
REDIS_URL=redis://default:<password>@<endpoint>:6379

# JWT
JWT_SECRET=your-super-secret-key-here
JWT_TTL=60

# Fudo POS
FUDO_CLIENT_ID=MDAwMDI6MDYzOTU2
FUDO_CLIENT_SECRET=xH6rdcTALbNBv3qBoAUyhYFz
FUDO_API_URL=https://api.fu.do

# WhatsApp (optional)
WHATSAPP_ACCESS_TOKEN=your-token
WHATSAPP_PHONE_NUMBER_ID=your-phone-id

# Google AI
GOOGLE_AI_API_KEY=your-gemini-key
```

---

## Quick Deploy Commands

### Full Deployment

```bash
# 1. Deploy Backend
cd backend
composer install --no-dev --optimize-autoloader
serverless deploy --stage prod

# 2. Get API URL from output
# Example: https://abc123.execute-api.us-east-1.amazonaws.com/prod

# 3. Update Frontend env
cd ../frontend
echo "VITE_API_URL=https://your-api-url" > .env.production

# 4. Deploy Frontend
vercel --prod
```

### Update Backend Only

```bash
cd backend
serverless deploy function -f api --stage prod
```

### Update Frontend Only

```bash
cd frontend
vercel --prod
```

---

## Alternative: Railway.app (Even Easier)

Railway offers free tier and is super simple:

1. **Connect GitHub**: https://railway.app/
2. **New Project** → Import from GitHub
3. **Add Services**:
   - Frontend (auto-detected)
   - Backend (auto-detected)
   - MongoDB (from marketplace)
   - Redis (from marketplace)
4. **Deploy** - Done!

Cost: $5/month after free tier

---

## Alternative: Render.com (Free Tier)

1. **Create Account**: https://render.com/
2. **New Web Service** → Connect GitHub
3. **Add Services**:
   - Static Site (Frontend) - Free
   - Web Service (Backend) - Free
   - PostgreSQL or MongoDB - Free
   - Redis - Free

---

## Monitoring (Free)

### Sentry (Error Tracking)
```bash
# Frontend
npm install @sentry/react

# Backend
composer require sentry/sentry-laravel
```

### Uptime Monitoring
- UptimeRobot: https://uptimerobot.com/ (Free)
- Better Uptime: https://betteruptime.com/ (Free tier)

---

## GitHub Actions CI/CD

Already configured in `.github/workflows/ci.yml`

Add secrets in GitHub:
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `VERCEL_TOKEN`
- `MONGO_URI`
- `REDIS_URL`

---

## Testing Deployment

```bash
# Test Backend
curl https://your-api-url/api/health

# Test Menu Endpoint
curl https://your-api-url/api/menu

# Test Frontend
open https://your-domain.vercel.app
```

---

## Troubleshooting

### Lambda Cold Starts
- First request may be slow (2-3s)
- Subsequent requests are fast (<100ms)
- Use provisioned concurrency for production (costs extra)

### MongoDB Connection
- Ensure IP whitelist includes 0.0.0.0/0
- Check connection string format
- Verify database user permissions

### CORS Issues
- Update `backend/config/cors.php`
- Add your Vercel domain to allowed origins

---

## Cost Optimization

1. **Use Free Tiers**:
   - Vercel: 100GB bandwidth/month
   - MongoDB Atlas: 512MB storage
   - Upstash Redis: 10K requests/day
   - AWS Lambda: 1M requests/month

2. **Optimize Lambda**:
   - Use smaller memory (128-256MB)
   - Reduce timeout (10-15s)
   - Enable caching

3. **CDN for Images**:
   - Use Cloudflare (free)
   - Or AWS CloudFront

---

## Next Steps

1. Deploy to staging first
2. Test all endpoints
3. Configure custom domain
4. Set up monitoring
5. Deploy to production

Need help? Check the logs:
```bash
# Lambda logs
serverless logs -f api --stage prod --tail

# Vercel logs
vercel logs
```
