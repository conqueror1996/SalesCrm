# 🎯 Deployment Checklist

Use this checklist to track your deployment progress.

## ✅ Pre-Deployment

- [ ] Code is working locally
- [ ] All changes committed to Git
- [ ] Code pushed to GitHub
- [ ] GitHub repository is public or accessible

---

## 📦 Part 1: Database Setup (5 min)

- [ ] Neon account created
- [ ] PostgreSQL database created
- [ ] Connection string copied
- [ ] Local `.env` updated with DATABASE_URL
- [ ] Migrations applied: `npx prisma migrate deploy`
- [ ] Prisma client generated: `npx prisma generate`
- [ ] Database tested locally

**Database URL:** `_________________________________`

---

## 🔧 Part 2: WhatsApp Server on Render (10 min)

- [ ] Render account created
- [ ] GitHub connected to Render
- [ ] Web service created
- [ ] Repository connected
- [ ] Service name: `whatsapp-server`
- [ ] Region: `Singapore`
- [ ] Build command: `npm install`
- [ ] Start command: `npm run whatsapp`
- [ ] Environment variables added:
  - [ ] `NODE_ENV=production`
  - [ ] `PORT=3002`
  - [ ] `DATABASE_URL` (from Part 1)
  - [ ] `TZ=Asia/Kolkata`
- [ ] Service deployed successfully
- [ ] Logs show: "WhatsApp API Server running"
- [ ] Health check works: `/health` returns 200 OK

**Render URL:** `_________________________________`

---

## 🌐 Part 3: Frontend on Vercel (5 min)

- [ ] Vercel account created
- [ ] GitHub connected to Vercel
- [ ] Project imported
- [ ] Framework detected: Next.js
- [ ] Environment variables added:
  - [ ] `DATABASE_URL` (from Part 1)
  - [ ] `NEXT_PUBLIC_WHATSAPP_SERVER_URL` (from Part 2)
  - [ ] `NEXTAUTH_URL` (your Vercel URL)
  - [ ] `NEXTAUTH_SECRET` (generated with `openssl rand -base64 32`)
  - [ ] `GOOGLE_CLIENT_ID` (optional)
  - [ ] `GOOGLE_CLIENT_SECRET` (optional)
- [ ] First deployment successful
- [ ] `NEXTAUTH_URL` updated with actual Vercel URL
- [ ] Redeployed after updating NEXTAUTH_URL
- [ ] Site loads successfully

**Vercel URL:** `_________________________________`

**NEXTAUTH_SECRET:** `_________________________________`

---

## 📡 Part 4: Monitoring Setup (5 min)

- [ ] UptimeRobot account created
- [ ] Monitor created
- [ ] Monitor type: HTTP(s)
- [ ] URL: `https://whatsapp-server-xxxx.onrender.com/health`
- [ ] Interval: 5 minutes
- [ ] Monitor is active and "Up"
- [ ] First check completed successfully

---

## 🔐 Part 5: Google OAuth (Optional - 10 min)

- [ ] Google Cloud Console project created
- [ ] Gmail API enabled
- [ ] OAuth consent screen configured
- [ ] OAuth credentials created
- [ ] Redirect URI added: `https://your-vercel-url/api/auth/callback/google`
- [ ] Client ID copied
- [ ] Client Secret copied
- [ ] Vercel environment variables updated
- [ ] Redeployed Vercel

**Google Client ID:** `_________________________________`

---

## 🧪 Part 6: Testing (5 min)

### Frontend Test:
- [ ] Vercel URL loads
- [ ] No console errors
- [ ] UI renders correctly
- [ ] Can navigate pages

### WhatsApp Test:
- [ ] Can click "Generate QR Code"
- [ ] QR code appears within 30 seconds
- [ ] Can scan QR code with WhatsApp
- [ ] WhatsApp connects successfully
- [ ] Connection status shows "Connected"

### Database Test:
- [ ] Can create a new lead
- [ ] Lead appears in list
- [ ] Can send a message
- [ ] Message appears in chat
- [ ] Refresh page - data persists

### Gmail Test (if configured):
- [ ] Can click "Connect Google Account"
- [ ] OAuth flow works
- [ ] Can fetch Gmail leads
- [ ] Leads appear in dashboard

---

## 🎨 Part 7: Optional Customization

- [ ] Custom domain added to Vercel
- [ ] DNS configured
- [ ] SSL certificate active
- [ ] Custom domain added to Render (optional)
- [ ] CORS updated with custom domain
- [ ] Redeployed services

**Custom Domain:** `_________________________________`

---

## 📊 Final Verification

- [ ] All services showing "Active" in dashboards
- [ ] No errors in Vercel logs
- [ ] No errors in Render logs
- [ ] UptimeRobot shows 100% uptime
- [ ] Can perform full user flow:
  - [ ] Login
  - [ ] View leads
  - [ ] Generate QR code
  - [ ] Connect WhatsApp
  - [ ] Send message
  - [ ] Create new lead
  - [ ] View message history
- [ ] Mobile responsive (test on phone)
- [ ] Performance is acceptable

---

## 📝 Important URLs to Save

```
Frontend:        _________________________________
WhatsApp Server: _________________________________
Database:        _________________________________
Health Check:    _________________________________

Vercel Dashboard:      https://vercel.com/dashboard
Render Dashboard:      https://dashboard.render.com
Neon Dashboard:        https://console.neon.tech
UptimeRobot Dashboard: https://uptimerobot.com/dashboard
```

---

## 🎉 Deployment Complete!

**Deployment Date:** `_________________________________`

**Total Time:** `_________________________________`

**Total Cost:** $0/month ✅

---

## 🔄 Next Steps

- [ ] Share app URL with team
- [ ] Set up team access in Vercel/Render
- [ ] Configure email notifications in UptimeRobot
- [ ] Set up analytics (optional)
- [ ] Create backup strategy
- [ ] Document any custom configurations
- [ ] Plan for future updates

---

## 📞 Emergency Contacts

**If something breaks:**

1. Check Vercel logs
2. Check Render logs
3. Check UptimeRobot status
4. Verify environment variables
5. Try redeploying

**Support:**
- Vercel: support@vercel.com
- Render: support@render.com
- Neon: support@neon.tech

---

**✅ All Done! Your Sales CRM is live!** 🚀
