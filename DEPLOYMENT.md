# Family Points App - Deployment Guide

## 🚀 Deploy to Vercel

### Option 1: Deploy via Vercel CLI (Recommended)

1. **Install Vercel CLI** (if not already installed):
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy from your project directory**:
   ```bash
   cd family-points-app
   vercel
   ```

4. **Follow the prompts**:
   - Set up and deploy? **Y**
   - Which scope? Choose your account
   - Link to existing project? **N** (for first deployment)
   - What's your project's name? `family-points-app` (or your preferred name)
   - In which directory is your code located? `./` (current directory)

5. **Your app will be deployed!** Vercel will give you a URL like `https://family-points-app-xxx.vercel.app`

### Option 2: Deploy via GitHub Integration

1. **Push your code to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/family-points-app.git
   git push -u origin main
   ```

2. **Go to [vercel.com](https://vercel.com)** and sign up/login

3. **Click "New Project"**

4. **Import your GitHub repository**:
   - Select your `family-points-app` repository
   - Vercel will automatically detect it's a Vite project

5. **Configure deployment**:
   - Framework Preset: **Vite**
   - Root Directory: `./` (or leave empty)
   - Build Command: `npm run build` (should be auto-detected)
   - Output Directory: `dist` (should be auto-detected)

6. **Click "Deploy"**

7. **Your app will be live!** Vercel will give you a production URL

### Option 3: Deploy via Vercel Dashboard

1. **Go to [vercel.com](https://vercel.com)** and sign up/login

2. **Click "New Project"**

3. **Import from Git Repository**:
   - Connect your GitHub account if not already connected
   - Select your `family-points-app` repository

4. **Configure the project**:
   - Framework: **Vite**
   - Root Directory: `./`
   - Build Command: `npm run build`
   - Output Directory: `dist`

5. **Deploy!**

## 📱 PWA Setup (Add to Home Screen)

### For Users:

#### On iOS (iPhone/iPad):
1. Open the app in Safari
2. Tap the **Share** button (square with arrow pointing up)
3. Scroll down and tap **"Add to Home Screen"**
4. Customize the name if desired
5. Tap **"Add"**

#### On Android:
1. Open the app in Chrome
2. Tap the **menu** (three dots) in the top right
3. Tap **"Add to Home Screen"** or **"Install App"**
4. Tap **"Add"** or **"Install"**

### For Developers:

The app is already configured as a PWA with:
- ✅ Web App Manifest (`/public/manifest.json`)
- ✅ Service Worker (`/public/sw.js`)
- ✅ Proper meta tags for iOS
- ✅ Icons for all platforms
- ✅ Splash screens for iOS

## 🔧 Custom Domain (Optional)

1. **In Vercel Dashboard**:
   - Go to your project
   - Click on **"Settings"** tab
   - Click on **"Domains"**
   - Add your custom domain

2. **Update DNS**:
   - Add a CNAME record pointing to `cname.vercel-dns.com`
   - Or add an A record pointing to Vercel's IP

## 🔄 Automatic Deployments

Once connected to GitHub:
- **Every push to `main` branch** = Automatic production deployment
- **Every pull request** = Preview deployment
- **Custom branches** = Preview deployments

## 📊 Monitoring & Analytics

Vercel provides built-in:
- **Performance monitoring**
- **Error tracking**
- **Analytics** (with Vercel Analytics)
- **Function logs**

## 🛠️ Environment Variables

If you need environment variables:
1. Go to your project in Vercel Dashboard
2. Click **"Settings"** → **"Environment Variables"**
3. Add your variables
4. Redeploy

## 🚀 Production Checklist

Before deploying to production:
- [ ] Test the app locally (`npm run dev`)
- [ ] Build the app (`npm run build`)
- [ ] Test the built version (`npm run preview`)
- [ ] Generate missing icons using `create-missing-icons.html`
- [ ] Generate splash screens using `create-splash-screens.html`
- [ ] Test PWA functionality (Add to Home Screen)
- [ ] Check all routes work correctly
- [ ] Verify mobile responsiveness

## 🐛 Troubleshooting

### Common Issues:

1. **Build fails**: Check `package.json` scripts and dependencies
2. **PWA not working**: Verify manifest.json and service worker
3. **Icons not showing**: Ensure all icon files exist in `/public`
4. **Routing issues**: Check Vercel's `vercel.json` configuration

### Getting Help:
- Vercel Documentation: https://vercel.com/docs
- Vite Documentation: https://vitejs.dev/guide/
- PWA Documentation: https://web.dev/progressive-web-apps/

## 🎉 You're All Set!

Your Family Points App is now ready for production deployment. Users can install it on their devices and use it like a native app!
