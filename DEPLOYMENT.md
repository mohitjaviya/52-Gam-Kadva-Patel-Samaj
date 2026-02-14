# 52 ગામ કડવા પટેલ સમાજ - Deployment Guide

## Quick Deploy Options

### Option 1: Railway (Recommended - Free tier available)

1. **Create account** at https://railway.app
2. **Connect GitHub** and push your code (without .env file)
3. **Create new project** → Deploy from GitHub repo
4. **Add environment variables** in Railway dashboard:
   ```
   PORT=3000
   NODE_ENV=production
   SESSION_SECRET=<generate-your-own-64-char-secret>
   EMAIL_SERVICE=gmail
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=<your-email@gmail.com>
   EMAIL_PASS=<your-app-password>
   FROM_EMAIL=Your Community <your-email@gmail.com>
   EMAIL_DEMO_MODE=false
   SMS_DEMO_MODE=true
   ADMIN_EMAIL=<admin@yourdomain.com>
   ADMIN_PASSWORD=<your-secure-password>
   ADMIN_PHONE=<admin-phone-number>
   ```
5. Deploy automatically triggers

### Option 2: Render (Free tier available)

1. **Create account** at https://render.com
2. **Connect GitHub** repository
3. **Create Web Service**:
   - Build Command: `npm install`
   - Start Command: `npm start`
4. **Add Environment Variables** in Render dashboard
5. Deploy

### Option 3: Vercel

1. Install Vercel CLI: `npm i -g vercel`
2. Run: `vercel` in project folder
3. Add environment variables in Vercel dashboard

### Option 4: VPS (DigitalOcean, AWS, etc.)

```bash
# 1. SSH into your server
ssh user@your-server-ip

# 2. Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 3. Install PM2 for process management
sudo npm install -g pm2

# 4. Clone your repository
git clone https://github.com/your-repo/community-service.git
cd community-service

# 5. Install dependencies
npm install

# 6. Create .env file with production values
nano .env

# 7. Start with PM2
pm2 start server.js --name "community-service"
pm2 save
pm2 startup

# 8. Setup Nginx reverse proxy (optional but recommended)
sudo apt install nginx
```

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| PORT | Server port | 3000 |
| NODE_ENV | Environment | production |
| SESSION_SECRET | 64+ char random string | abc123... |
| EMAIL_USER | Gmail address | your-email@gmail.com |
| EMAIL_PASS | Gmail App Password | xxxx xxxx xxxx xxxx |
| EMAIL_DEMO_MODE | Enable real emails | false |
| SMS_DEMO_MODE | SMS (keep true unless Twilio setup) | true |
| ADMIN_EMAIL | Admin login email | admin@community.com |
| ADMIN_PASSWORD | Admin password | YourSecurePassword123 |
| ADMIN_PHONE | Admin phone number | 9999999999 |

## Important Notes

1. **Never commit .env file** - It's in .gitignore
2. **Database**: Uses SQLite (sql.js) - file-based, auto-creates
3. **Admin Login**: Set via ADMIN_EMAIL and ADMIN_PASSWORD env variables
4. **First run**: Database and admin user created automatically

## Post-Deployment Checklist

- [ ] Test user registration
- [ ] Test login functionality
- [ ] Test email sending
- [ ] Verify admin panel access
- [ ] Test search functionality
- [ ] Check mobile responsiveness
