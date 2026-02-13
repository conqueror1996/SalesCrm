# 🚀 Quick Reference: Render.com Deployment

## 📝 Files Created

1. **`render.yaml`** - Render.com service configuration
2. **`RENDER_DEPLOYMENT.md`** - Complete deployment guide
3. **`.env.render`** - Environment variables template for Render
4. **`.env.local.example`** - Local development environment template

## 🔧 Code Changes

### Updated Files:
- ✅ `scripts/whatsapp-server.ts` - Added `/health` endpoint
- ✅ `src/app/page.tsx` - Uses `WHATSAPP_SERVER_URL` environment variable
- ✅ `src/app/api/whatsapp/send/route.ts` - Uses environment variable

### Environment Variable:
```bash
NEXT_PUBLIC_WHATSAPP_SERVER_URL=https://your-app.onrender.com
```

## 🎯 Next Steps

### 1. Push to GitHub
```bash
git add .
git commit -m "Add Render.com deployment configuration"
git push origin main
```

### 2. Deploy to Render
Follow the guide in `RENDER_DEPLOYMENT.md`

### 3. Set Environment Variable
After deployment, add to your `.env.local`:
```bash
NEXT_PUBLIC_WHATSAPP_SERVER_URL=https://whatsapp-server-xxxx.onrender.com
```

### 4. Set Up UptimeRobot
- URL: `https://whatsapp-server-xxxx.onrender.com/health`
- Interval: 5 minutes
- Keeps server awake 24/7 for FREE!

## 🧪 Testing

### Local Development:
```bash
# Terminal 1: WhatsApp Server
npm run whatsapp

# Terminal 2: Next.js App
npm run dev
```

### Production:
- WhatsApp Server: Runs on Render.com
- Next.js App: Can deploy to Vercel
- They communicate via the environment variable

## 📊 Cost Breakdown

| Service | Cost | Purpose |
|---------|------|---------|
| Render.com | FREE | WhatsApp Server (24/7) |
| UptimeRobot | FREE | Keep server awake |
| Vercel | FREE | Next.js Frontend |
| **Total** | **$0/month** | 🎉 |

## 🔗 Important URLs

After deployment, save these:

- **Render Dashboard:** https://dashboard.render.com
- **WhatsApp Server:** https://whatsapp-server-xxxx.onrender.com
- **Health Check:** https://whatsapp-server-xxxx.onrender.com/health
- **UptimeRobot:** https://uptimerobot.com/dashboard

## 🐛 Troubleshooting

### Server sleeps despite UptimeRobot:
- Check UptimeRobot is active
- Verify health endpoint returns 200 OK
- Check Render logs for errors

### Frontend can't connect:
- Verify `NEXT_PUBLIC_WHATSAPP_SERVER_URL` is set correctly
- Check CORS settings on Render
- Ensure server is running (check Render dashboard)

### WhatsApp won't connect:
- Check Render logs for Puppeteer errors
- Verify session storage is working
- Try restarting the service

## 📚 Documentation

- **Full Guide:** `RENDER_DEPLOYMENT.md`
- **Render Docs:** https://render.com/docs
- **WhatsApp Web.js:** https://wwebjs.dev

---

**Ready to deploy? Open `RENDER_DEPLOYMENT.md` for step-by-step instructions!** 🚀
