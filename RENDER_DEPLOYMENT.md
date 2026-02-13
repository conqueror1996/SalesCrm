# 🚀 Deploying WhatsApp Server to Render.com

## Prerequisites
- GitHub account
- Your code pushed to GitHub repository
- Render.com account (free - no credit card required)

---

## 📋 Step-by-Step Deployment Guide

### **Step 1: Push Code to GitHub**

```bash
# If not already done, initialize git and push to GitHub
git add .
git commit -m "Add Render.com deployment config"
git push origin main
```

---

### **Step 2: Create Render.com Account**

1. Go to [https://render.com](https://render.com)
2. Click **"Get Started for Free"**
3. Sign up with your **GitHub account** (easiest)
4. Authorize Render to access your repositories

---

### **Step 3: Create New Web Service**

1. Click **"New +"** button in dashboard
2. Select **"Web Service"**
3. Connect your GitHub repository:
   - Click **"Connect a repository"**
   - Find and select your `sales-crm` repository
   - Click **"Connect"**

---

### **Step 4: Configure Service**

Fill in the following settings:

**Basic Settings:**
- **Name:** `whatsapp-server` (or any name you prefer)
- **Region:** `Singapore` (closest to India)
- **Branch:** `main` (or your default branch)
- **Root Directory:** Leave blank
- **Runtime:** `Node`

**Build & Deploy:**
- **Build Command:** `npm install`
- **Start Command:** `npm run whatsapp`

**Instance Type:**
- Select **"Free"** plan

---

### **Step 5: Add Environment Variables**

Click **"Advanced"** and add these environment variables:

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `PORT` | `3002` |
| `DATABASE_URL` | Your PostgreSQL connection string |
| `TZ` | `Asia/Kolkata` |

**Where to get DATABASE_URL:**
- If using Render PostgreSQL: Create a new PostgreSQL database in Render, copy the "Internal Database URL"
- If using external DB (like Neon, Supabase): Copy your connection string

---

### **Step 6: Deploy**

1. Click **"Create Web Service"**
2. Wait 3-5 minutes for deployment
3. Watch the logs for:
   ```
   🔄 Initializing WhatsApp Client...
   🚀 WhatsApp API Server running on port 3002
   ```

---

### **Step 7: Get Your Server URL**

After deployment, you'll get a URL like:
```
https://whatsapp-server-xxxx.onrender.com
```

**Copy this URL** - you'll need it for the next steps!

---

### **Step 8: Update Frontend to Use Render URL**

Update your frontend (`src/app/page.tsx`) to use the Render URL instead of localhost:

**Find and replace:**
```typescript
// OLD (localhost)
'http://localhost:3002/status'
'http://localhost:3002/init'
'http://localhost:3002/restart'

// NEW (Render URL)
'https://whatsapp-server-xxxx.onrender.com/status'
'https://whatsapp-server-xxxx.onrender.com/init'
'https://whatsapp-server-xxxx.onrender.com/restart'
```

**Or better - use environment variable:**

Create `.env.local`:
```bash
NEXT_PUBLIC_WHATSAPP_SERVER_URL=https://whatsapp-server-xxxx.onrender.com
```

Then update code to use:
```typescript
const WHATSAPP_URL = process.env.NEXT_PUBLIC_WHATSAPP_SERVER_URL || 'http://localhost:3002';
```

---

### **Step 9: Keep Server Alive (IMPORTANT!)**

Render free tier **sleeps after 15 minutes of inactivity**. To keep it awake:

#### **Option A: UptimeRobot (Recommended - FREE)**

1. Go to [https://uptimerobot.com](https://uptimerobot.com)
2. Sign up for free account
3. Click **"Add New Monitor"**
4. Configure:
   - **Monitor Type:** HTTP(s)
   - **Friendly Name:** WhatsApp Server
   - **URL:** `https://whatsapp-server-xxxx.onrender.com/health`
   - **Monitoring Interval:** 5 minutes
5. Click **"Create Monitor"**

✅ Done! Your server will now stay awake 24/7 for FREE!

#### **Option B: Cron-job.org (Alternative)**

1. Go to [https://cron-job.org](https://cron-job.org)
2. Create free account
3. Create new cron job:
   - **URL:** `https://whatsapp-server-xxxx.onrender.com/health`
   - **Schedule:** Every 5 minutes
4. Enable the job

---

### **Step 10: Test Your Deployment**

1. Open your frontend at `http://localhost:3000` (or your deployed frontend)
2. Click **"Generate QR Code"**
3. Wait for QR code to appear
4. Scan with WhatsApp mobile app
5. ✅ Connected!

---

## 🔍 Monitoring & Logs

### **View Logs:**
1. Go to Render dashboard
2. Click on your `whatsapp-server` service
3. Click **"Logs"** tab
4. Watch real-time logs

### **Check Health:**
Visit: `https://whatsapp-server-xxxx.onrender.com/health`

Should return:
```json
{
  "status": "ok",
  "uptime": 12345,
  "timestamp": "2026-02-13T09:12:15.000Z",
  "whatsapp": {
    "connected": false,
    "initializing": false,
    "hasQR": false
  }
}
```

---

## 🐛 Troubleshooting

### **Server keeps sleeping:**
- Make sure UptimeRobot is configured correctly
- Check that the health endpoint is responding
- Verify monitoring interval is 5 minutes or less

### **WhatsApp won't connect:**
- Check logs for errors
- Ensure Puppeteer dependencies are installed (Render handles this automatically)
- Try restarting the service

### **Database connection errors:**
- Verify DATABASE_URL is correct
- Check that database is accessible from Render
- Ensure database is in the same region (for better performance)

### **Build fails:**
- Check that all dependencies are in `package.json`
- Verify Node version compatibility
- Review build logs for specific errors

---

## 💰 Cost Breakdown

**Render.com Free Tier:**
- ✅ 750 hours/month (enough for 24/7 with one service)
- ✅ 512MB RAM
- ✅ Shared CPU
- ✅ 100GB bandwidth/month
- ✅ Free SSL certificates
- ⚠️ Sleeps after 15 min inactivity (solved with UptimeRobot)

**UptimeRobot Free Tier:**
- ✅ 50 monitors
- ✅ 5-minute check intervals
- ✅ Email alerts
- ✅ Unlimited

**Total Cost: $0/month** 🎉

---

## 🔄 Auto-Deploy on Git Push

Render automatically redeploys when you push to GitHub:

```bash
git add .
git commit -m "Update WhatsApp server"
git push origin main
```

Render will detect the push and redeploy automatically! ✨

---

## 📞 Support

- **Render Docs:** [https://render.com/docs](https://render.com/docs)
- **Render Community:** [https://community.render.com](https://community.render.com)
- **WhatsApp Web.js Docs:** [https://wwebjs.dev](https://wwebjs.dev)

---

## ✅ Checklist

- [ ] Code pushed to GitHub
- [ ] Render.com account created
- [ ] Web service created and deployed
- [ ] Environment variables configured
- [ ] Database connected
- [ ] UptimeRobot monitor set up
- [ ] Frontend updated with Render URL
- [ ] QR code tested and working
- [ ] WhatsApp connected successfully

---

**🎉 Congratulations! Your WhatsApp server is now running 24/7 for FREE!**
