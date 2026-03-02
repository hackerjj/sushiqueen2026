# Deploy Sushi Queen to Render.com

## Why Render?
- ✅ Free tier (no credit card required)
- ✅ Auto-deploy from GitHub
- ✅ Free MongoDB & Redis included
- ✅ Zero configuration needed
- ✅ SSL certificates automatic
- ✅ Similar to your Valoria setup

## Quick Deploy (5 minutes)

### Step 1: Sign Up
1. Go to https://render.com/
2. Click "Get Started for Free"
3. Sign in with GitHub

### Step 2: Deploy from GitHub
1. Click "New +" → "Blueprint"
2. Connect your GitHub repo: `hackerjj/sushiqueen2026`
3. Click "Apply" - Render will read `render.yaml`
4. Wait 5-10 minutes for deployment

### Step 3: Add Environment Variables
In Render dashboard, go to backend service → Environment:
- `FUDO_CLIENT_ID`: MDAwMDI6MDYzOTU2
- `FUDO_CLIENT_SECRET`: xH6rdcTALbNBv3qBoAUyhYFz
- `GOOGLE_AI_API_KEY`: (your Gemini key)
- `WHATSAPP_ACCESS_TOKEN`: (optional)

### Step 4: Test
- Frontend: https://sushi-queen-frontend.onrender.com
- Backend: https://sushi-queen-backend.onrender.com/api/health

Done! 🎉

## Free Tier Limits
- 750 hours/month (enough for 1 service 24/7)
- 100GB bandwidth
- MongoDB: 512MB storage
- Redis: 25MB storage
- Apps sleep after 15 min inactivity (wakes in ~30s)

## Manual Deploy Alternative

If Blueprint doesn't work, deploy manually:

### Frontend
1. New → Static Site
2. Connect GitHub repo
3. Build: `cd frontend && npm install && npm run build`
4. Publish: `frontend/dist`

### Backend
1. New → Web Service
2. Connect GitHub repo
3. Runtime: PHP
4. Build: `cd backend && composer install`
5. Start: `cd backend && php artisan serve --host=0.0.0.0 --port=$PORT`

### Databases
1. New → MongoDB (free)
2. New → Redis (free)
3. Link to backend service

## Troubleshooting

### Cold Starts
Free tier apps sleep after 15 min. First request takes ~30s to wake.
Solution: Upgrade to $7/month for always-on.

### Build Fails
Check logs in Render dashboard. Common issues:
- Missing composer.json dependencies
- Node version mismatch
- Environment variables not set

## Cost
- **Free**: Perfect for testing/demo
- **$7/month**: Always-on, no cold starts
- **$25/month**: More resources for production

## Next Steps
1. Add custom domain
2. Set up monitoring
3. Configure backups
4. Add staging environment
