# 🚀 Complete Deployment Guide: Vercel + Render.com

## Overview

This guide will help you deploy your complete Sales CRM:
- **Frontend (Next.js)** → Vercel (FREE)
- **WhatsApp Server** → Render.com (FREE)
- **Database** → Neon/Supabase (FREE)

**Total Cost: $0/month** 🎉

---

## 📋 Prerequisites

- [x] GitHub account
- [x] Vercel account (sign up at vercel.com)
- [x] Render account (sign up at render.com)
- [x] Code pushed to GitHub repository

---

# Part 1: Deploy Database (5 minutes)

## Option A: Neon PostgreSQL (Recommended)

### Step 1: Create Neon Account
1. Go to [https://neon.tech](https://neon.tech)
2. Click **"Sign Up"** (use GitHub for easy login)
3. Click **"Create a project"**

### Step 2: Configure Database
- **Project Name:** `sales-crm-db`
- **Region:** `AWS / Asia Pacific (Mumbai)` (closest to India)
- **PostgreSQL Version:** 16 (latest)
- Click **"Create Project"**

### Step 3: Get Connection String
1. After creation, you'll see **"Connection String"**
2. Copy the connection string (looks like):
   ```
   postgresql://user:password@ep-xxx.ap-south-1.aws.neon.tech/neondb?sslmode=require
   ```
3. **Save this!** You'll need it for both Render and Vercel

### Step 4: Run Migrations
```bash
# In your local terminal
# Update .env with your Neon connection string
echo "DATABASE_URL=postgresql://user:password@ep-xxx.ap-south-1.aws.neon.tech/neondb?sslmode=require" > .env

# Run Prisma migrations
npx prisma migrate deploy
npx prisma generate
```

---

# Part 2: Deploy WhatsApp Server to Render.com (10 minutes)

## Step 1: Push Code to GitHub

```bash
# Make sure all changes are committed
git add .
git commit -m "Add deployment configuration"
git push origin main
```

## Step 2: Create Render Account

1. Go to [https://render.com](https://render.com)
2. Click **"Get Started for Free"**
3. Sign up with **GitHub** (easiest option)
4. Authorize Render to access your repositories

## Step 3: Create Web Service

1. Click **"New +"** button in dashboard
2. Select **"Web Service"**
3. Click **"Connect a repository"**
4. Find and select your `sales-crm` repository
5. Click **"Connect"**

## Step 4: Configure Service

Fill in these settings:

### Basic Settings:
| Field | Value |
|-------|-------|
| **Name** | `whatsapp-server` |
| **Region** | `Singapore` |
| **Branch** | `main` |
| **Root Directory** | (leave blank) |
| **Runtime** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `npm run whatsapp` |

### Instance Type:
- Select **"Free"** plan

## Step 5: Add Environment Variables

Click **"Advanced"** → **"Add Environment Variable"**

Add these variables:

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `PORT` | `3002` |
| `DATABASE_URL` | Your Neon connection string from Part 1 |
| `TZ` | `Asia/Kolkata` |

**Example:**
```bash
NODE_ENV=production
PORT=3002
DATABASE_URL=postgresql://user:password@ep-xxx.ap-south-1.aws.neon.tech/neondb?sslmode=require
TZ=Asia/Kolkata
```

## Step 6: Deploy

1. Click **"Create Web Service"**
2. Wait 3-5 minutes for deployment
3. Watch the logs - you should see:
   ```
   🔄 Initializing WhatsApp Client...
   🚀 WhatsApp API Server running on port 3002
   ```

## Step 7: Get Your Render URL

After deployment, you'll get a URL like:
```
https://whatsapp-server-xxxx.onrender.com
```

**📝 COPY THIS URL - You'll need it for Vercel!**

## Step 8: Test Your WhatsApp Server

Visit: `https://whatsapp-server-xxxx.onrender.com/health`

You should see:
```json
{
  "status": "ok",
  "uptime": 123,
  "timestamp": "2026-02-13T09:16:44.000Z",
  "whatsapp": {
    "connected": false,
    "initializing": false,
    "hasQR": false
  }
}
```

✅ **WhatsApp Server is LIVE!**

---

# Part 3: Deploy Frontend to Vercel (5 minutes)

## Step 1: Create Vercel Account

1. Go to [https://vercel.com](https://vercel.com)
2. Click **"Sign Up"**
3. Sign up with **GitHub** (easiest)
4. Authorize Vercel

## Step 2: Import Project

1. Click **"Add New..."** → **"Project"**
2. Find your `sales-crm` repository
3. Click **"Import"**

## Step 3: Configure Project

### Framework Preset:
- Vercel will auto-detect **Next.js** ✅

### Root Directory:
- Leave as **"./"** (root)

### Build Settings:
- **Build Command:** `npm run build` (auto-detected)
- **Output Directory:** `.next` (auto-detected)
- **Install Command:** `npm install` (auto-detected)

## Step 4: Add Environment Variables

Click **"Environment Variables"** and add these:

| Name | Value | Where to get it |
|------|-------|-----------------|
| `DATABASE_URL` | Your Neon connection string | From Part 1 |
| `NEXT_PUBLIC_WHATSAPP_SERVER_URL` | Your Render URL | From Part 2, Step 7 |
| `NEXTAUTH_URL` | `https://your-app.vercel.app` | Will be generated after deploy |
| `NEXTAUTH_SECRET` | Generate random string | Use: `openssl rand -base64 32` |
| `GOOGLE_CLIENT_ID` | Your Google OAuth ID | From Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | Your Google OAuth Secret | From Google Cloud Console |

**Example:**
```bash
DATABASE_URL=postgresql://user:password@ep-xxx.ap-south-1.aws.neon.tech/neondb?sslmode=require
NEXT_PUBLIC_WHATSAPP_SERVER_URL=https://whatsapp-server-xxxx.onrender.com
NEXTAUTH_URL=https://sales-crm-xxxx.vercel.app
NEXTAUTH_SECRET=your-generated-secret-here
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### Generate NEXTAUTH_SECRET:
```bash
# Run this in your terminal
openssl rand -base64 32
```

## Step 5: Deploy

1. Click **"Deploy"**
2. Wait 2-3 minutes
3. You'll get a URL like: `https://sales-crm-xxxx.vercel.app`

## Step 6: Update NEXTAUTH_URL

1. Copy your Vercel URL
2. Go to Vercel dashboard → Your project → **Settings** → **Environment Variables**
3. Edit `NEXTAUTH_URL` and set it to your Vercel URL
4. Click **"Save"**
5. Go to **Deployments** → Click **"..."** on latest deployment → **"Redeploy"**

✅ **Frontend is LIVE!**

---

# Part 4: Keep WhatsApp Server Awake (5 minutes)

Render free tier sleeps after 15 minutes. We'll use UptimeRobot to keep it awake.

## Step 1: Create UptimeRobot Account

1. Go to [https://uptimerobot.com](https://uptimerobot.com)
2. Click **"Register for FREE"**
3. Verify your email

## Step 2: Add Monitor

1. Click **"+ Add New Monitor"**
2. Fill in:

| Field | Value |
|-------|-------|
| **Monitor Type** | `HTTP(s)` |
| **Friendly Name** | `WhatsApp Server` |
| **URL** | `https://whatsapp-server-xxxx.onrender.com/health` |
| **Monitoring Interval** | `5 minutes` |

3. Click **"Create Monitor"**

✅ **Your server will now stay awake 24/7!**

---

# Part 5: Configure Google OAuth (Optional - for Gmail integration)

## Step 1: Go to Google Cloud Console

1. Visit [https://console.cloud.google.com](https://console.cloud.google.com)
2. Create a new project or select existing one

## Step 2: Enable Gmail API

1. Go to **"APIs & Services"** → **"Library"**
2. Search for **"Gmail API"**
3. Click **"Enable"**

## Step 3: Create OAuth Credentials

1. Go to **"APIs & Services"** → **"Credentials"**
2. Click **"Create Credentials"** → **"OAuth client ID"**
3. Configure consent screen if prompted
4. Select **"Web application"**
5. Add authorized redirect URIs:
   ```
   https://sales-crm-xxxx.vercel.app/api/auth/callback/google
   ```
6. Click **"Create"**
7. Copy **Client ID** and **Client Secret**

## Step 4: Update Vercel Environment Variables

1. Go to Vercel → Your project → **Settings** → **Environment Variables**
2. Add/Update:
   - `GOOGLE_CLIENT_ID`: Your client ID
   - `GOOGLE_CLIENT_SECRET`: Your client secret
3. Redeploy

---

# Part 6: Test Everything (5 minutes)

## Test 1: Frontend Access

1. Visit your Vercel URL: `https://sales-crm-xxxx.vercel.app`
2. You should see the login page
3. ✅ Frontend is working!

## Test 2: WhatsApp Connection

1. Click on a lead (or create a test lead)
2. Click **"🚀 Generate QR Code"**
3. Wait 10-30 seconds
4. QR code should appear
5. Scan with WhatsApp mobile app
6. ✅ WhatsApp is connected!

## Test 3: Database Connection

1. Create a new lead
2. Send a message
3. Refresh the page
4. Lead and message should persist
5. ✅ Database is working!

## Test 4: Gmail Integration (if configured)

1. Click **"Connect Google Account"**
2. Authorize
3. Click **"Fetch Gmail Leads"**
4. ✅ Gmail integration working!

---

# 📊 Deployment Summary

| Component | Platform | URL | Cost |
|-----------|----------|-----|------|
| **Frontend** | Vercel | `https://sales-crm-xxxx.vercel.app` | FREE |
| **WhatsApp Server** | Render | `https://whatsapp-server-xxxx.onrender.com` | FREE |
| **Database** | Neon | `ep-xxx.ap-south-1.aws.neon.tech` | FREE |
| **Monitoring** | UptimeRobot | Dashboard | FREE |
| **Total** | - | - | **$0/month** 🎉 |

---

# 🔧 Post-Deployment Configuration

## Update CORS (if needed)

If you get CORS errors, update `scripts/whatsapp-server.ts`:

```typescript
app.use(cors({ 
  origin: [
    'http://localhost:3000',
    'https://sales-crm-xxxx.vercel.app'
  ], 
  credentials: true 
}));
```

Then redeploy Render service.

## Set Up Custom Domain (Optional)

### For Vercel:
1. Go to Vercel → Your project → **Settings** → **Domains**
2. Add your domain
3. Update DNS records as instructed

### For Render:
1. Go to Render → Your service → **Settings** → **Custom Domain**
2. Add your domain
3. Update DNS records

---

# 🐛 Troubleshooting

## Frontend can't connect to WhatsApp server

**Check:**
1. `NEXT_PUBLIC_WHATSAPP_SERVER_URL` is set correctly in Vercel
2. Render service is running (check dashboard)
3. CORS is configured correctly
4. Try redeploying both services

**Fix:**
```bash
# Verify environment variable
echo $NEXT_PUBLIC_WHATSAPP_SERVER_URL

# Should output: https://whatsapp-server-xxxx.onrender.com
```

## WhatsApp server keeps sleeping

**Check:**
1. UptimeRobot monitor is active
2. Health endpoint returns 200 OK
3. Monitoring interval is 5 minutes or less

**Fix:**
- Visit UptimeRobot dashboard
- Ensure monitor is "Up"
- Check last check time

## Database connection errors

**Check:**
1. `DATABASE_URL` is correct in both Vercel and Render
2. Database is accessible
3. Migrations are applied

**Fix:**
```bash
# Run migrations locally first
npx prisma migrate deploy

# Then redeploy services
```

## Build fails on Vercel

**Check:**
1. All dependencies in `package.json`
2. TypeScript errors
3. Environment variables are set

**Fix:**
- Check build logs in Vercel
- Fix errors locally first
- Push and redeploy

---

# 🔄 Updating Your App

## Update Frontend:
```bash
git add .
git commit -m "Update frontend"
git push origin main
```
→ Vercel auto-deploys ✅

## Update WhatsApp Server:
```bash
git add .
git commit -m "Update WhatsApp server"
git push origin main
```
→ Render auto-deploys ✅

## Update Database Schema:
```bash
# 1. Update schema.prisma
# 2. Create migration
npx prisma migrate dev --name your_migration_name

# 3. Apply to production
npx prisma migrate deploy

# 4. Push changes
git add .
git commit -m "Update database schema"
git push origin main
```

---

# 📈 Monitoring & Logs

## Vercel Logs:
1. Go to Vercel dashboard
2. Click your project
3. Click **"Logs"** tab
4. View real-time logs

## Render Logs:
1. Go to Render dashboard
2. Click your service
3. Click **"Logs"** tab
4. View real-time logs

## Database Monitoring:
1. Go to Neon dashboard
2. Click your project
3. View **"Monitoring"** tab
4. See queries, connections, storage

---

# 🎯 Quick Reference

## Important URLs

Save these for easy access:

```bash
# Frontend
https://sales-crm-xxxx.vercel.app

# WhatsApp Server
https://whatsapp-server-xxxx.onrender.com

# Health Check
https://whatsapp-server-xxxx.onrender.com/health

# Dashboards
https://vercel.com/dashboard
https://dashboard.render.com
https://console.neon.tech
https://uptimerobot.com/dashboard
```

## Environment Variables Checklist

### Vercel:
- [ ] `DATABASE_URL`
- [ ] `NEXT_PUBLIC_WHATSAPP_SERVER_URL`
- [ ] `NEXTAUTH_URL`
- [ ] `NEXTAUTH_SECRET`
- [ ] `GOOGLE_CLIENT_ID` (optional)
- [ ] `GOOGLE_CLIENT_SECRET` (optional)

### Render:
- [ ] `NODE_ENV`
- [ ] `PORT`
- [ ] `DATABASE_URL`
- [ ] `TZ`

---

# 🎉 Success Checklist

- [ ] Database created on Neon
- [ ] Migrations applied
- [ ] WhatsApp server deployed to Render
- [ ] WhatsApp server health check returns 200 OK
- [ ] UptimeRobot monitor set up
- [ ] Frontend deployed to Vercel
- [ ] All environment variables configured
- [ ] Frontend loads successfully
- [ ] Can generate QR code
- [ ] WhatsApp connects successfully
- [ ] Can create leads
- [ ] Can send messages
- [ ] Data persists in database
- [ ] Gmail integration working (if configured)

---

# 📞 Support & Resources

## Documentation:
- **Vercel:** [https://vercel.com/docs](https://vercel.com/docs)
- **Render:** [https://render.com/docs](https://render.com/docs)
- **Neon:** [https://neon.tech/docs](https://neon.tech/docs)
- **Next.js:** [https://nextjs.org/docs](https://nextjs.org/docs)
- **Prisma:** [https://www.prisma.io/docs](https://www.prisma.io/docs)
- **WhatsApp Web.js:** [https://wwebjs.dev](https://wwebjs.dev)

## Community:
- **Vercel Discord:** [https://vercel.com/discord](https://vercel.com/discord)
- **Render Community:** [https://community.render.com](https://community.render.com)

---

**🎊 Congratulations! Your Sales CRM is now fully deployed and running 24/7 for FREE!**

**Total deployment time: ~30 minutes**
**Total cost: $0/month**

Enjoy your production-ready Sales CRM! 🚀
