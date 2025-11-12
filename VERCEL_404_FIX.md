# Vercel 404 Routes Fix - Complete Guide

## Problem
Routes work locally but return 404 NOT_FOUND on Vercel. This happens because Vercel doesn't know to serve `index.html` for client-side routing.

## Solution Steps

### 1. ✅ Already Created: `vercel.json`
The `vercel.json` file has been created in your project root with:
- **Rewrites rule**: Routes all requests to `/index.html` so React Router can handle them
- **Environment variables**: Configured for Firebase (using Vercel secrets)
- **Build commands**: Specified `npm run build` as build command

### 2. Update Vercel Project Settings

Go to your Vercel dashboard and:

1. **Select your project** from the dashboard
2. **Go to Settings** → **Build & Development Settings**
3. **Build Command**: Ensure it's set to `npm run build`
4. **Output Directory**: Ensure it's set to `dist` (Vite default)
5. **Framework Preset**: Select `Vite` if not already set

### 3. Set Environment Variables

In Vercel Dashboard:

1. **Go to Settings** → **Environment Variables**
2. **Add each Firebase variable**:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`

Note: These must start with `VITE_` to be accessible in browser (Vite requirement)

### 4. Verify Environment File Locally

Check your `.env.local` file exists with these values:
```
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
# ... etc
```

### 5. Redeploy

After updating `vercel.json` and environment variables:

```bash
git add vercel.json
git commit -m "Add vercel.json for client-side routing"
git push
```

Vercel will automatically trigger a new deployment.

## How It Works

When you navigate to `/profile`:
1. Vercel receives request for `/profile`
2. `vercel.json` rewrites it to `/index.html`
3. Your React app loads and React Router handles the routing
4. Correct component renders

## Common Issues & Fixes

### Still Getting 404?
1. Hard refresh browser (Ctrl+Shift+R or Cmd+Shift+R)
2. Clear browser cache or use incognito window
3. Check that the rewrite rule is in `vercel.json`
4. Wait 2-3 minutes for Vercel deployment to complete

### Routes work but data doesn't load?
Check Environment Variables are set in Vercel dashboard with correct values.

### Environment variables undefined?
- Ensure variable names start with `VITE_`
- Restart dev server locally after adding `.env.local`
- Check variable names match exactly (case-sensitive)

## File Structure Check

Your project should have:
```
your-project/
├── vercel.json          ← Newly created
├── vite.config.js       ✓ Correct
├── package.json         ✓ Correct
├── index.html           ✓ Must exist
├── src/
│   ├── main.jsx
│   ├── App.jsx
│   └── ...
└── .env.local          (local only, not committed)
```

## Reference
- [Vercel Rewrites Documentation](https://vercel.com/docs/edge-network/rewrites-and-redirects)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-modes.html)
