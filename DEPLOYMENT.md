# 🚀 Vercel Deployment Guide

## Pre-Deployment Checklist

✅ Build tested locally (`npm run build`)
✅ Production preview tested (`npm run preview`)
✅ `vercel.json` created for SPA routing
✅ All environment variables identified

## Deployment Steps

### 1. Install Vercel CLI (Optional)

```bash
npm install -g vercel
```

### 2. Deploy via Vercel Dashboard (Recommended)

1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "chore: Add Vercel deployment config"
   git push
   ```

2. **Import to Vercel**:
   - Go to [vercel.com/new](https://vercel.com/new)
   - Click "Import Git Repository"
   - Select your `politikoi` repository
   - Click "Import"

3. **Configure Build Settings**:
   - Framework Preset: **Vite**
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

4. **Add Environment Variables**:

   Click "Environment Variables" and add:

   ```
   VITE_SUPABASE_URL=https://ibojdzbbuvagggbybbnk.supabase.co
   VITE_SUPABASE_ANON_KEY=your_anon_key
   VITE_SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

   ⚠️ **SECURITY WARNING**:
   - Add `VITE_SUPABASE_SERVICE_ROLE_KEY` as **Encrypted**
   - This key has admin privileges
   - Keep it secure

5. **Deploy**:
   - Click "Deploy"
   - Wait for deployment to complete (~2-3 minutes)

### 3. Deploy via Vercel CLI (Alternative)

```bash
# Login to Vercel
vercel login

# Deploy to production
vercel --prod

# Add environment variables
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
vercel env add VITE_SUPABASE_SERVICE_ROLE_KEY
```

## Post-Deployment

### 1. Test the Deployment

Visit your Vercel URL (e.g., `https://politikoi.vercel.app`)

Test:
- ✅ Login with admin@politikoi.gr
- ✅ Navigate to Admin Settings
- ✅ Create a test user
- ✅ Delete the test user
- ✅ Check all pages load correctly
- ✅ Test realtime updates (if applicable)

### 2. Configure Custom Domain (Optional)

1. Go to Project Settings > Domains
2. Add your custom domain
3. Update DNS records as instructed by Vercel
4. Wait for DNS propagation (~24-48 hours)

### 3. Update Supabase URL Redirects

If using auth redirects, update Supabase settings:

1. Go to Supabase Dashboard
2. Authentication > URL Configuration
3. Add your Vercel URL to "Redirect URLs":
   ```
   https://your-app.vercel.app/**
   ```

## Environment Variables Reference

| Variable | Required | Description | Security |
|----------|----------|-------------|----------|
| `VITE_SUPABASE_URL` | ✅ Yes | Supabase project URL | Public |
| `VITE_SUPABASE_ANON_KEY` | ✅ Yes | Anonymous access key | Public |
| `VITE_SUPABASE_SERVICE_ROLE_KEY` | ✅ Yes | Admin operations key | **SECRET** |

## Troubleshooting

### Build Fails

```bash
# Test build locally first
npm run build

# Check Node.js version (should be 20.19+ or 22.12+)
node --version

# Update if needed
nvm install 22
nvm use 22
```

### 404 Errors on Refresh

- Verify `vercel.json` exists with SPA rewrite rules
- Redeploy if needed

### Authentication Not Working

1. Check environment variables are set correctly
2. Verify Supabase URL and keys match production project
3. Check Supabase URL redirects include Vercel domain

### Admin Features Not Working

- Verify `VITE_SUPABASE_SERVICE_ROLE_KEY` is set
- Check it's the correct key for your project
- Ensure it's marked as encrypted in Vercel

## Continuous Deployment

Vercel automatically deploys when you push to GitHub:

```bash
git add .
git commit -m "feat: Add new feature"
git push
# Vercel will automatically deploy
```

### Branch Deployments

- `main` branch → Production
- Other branches → Preview deployments
- Pull requests → Preview deployments

## Performance Optimization

### Current Bundle Sizes

- Total: ~1.2 MB (before gzip)
- Largest chunks:
  - charts-BYoR0FVE.js: 346.84 KB (103.01 KB gzipped)
  - index-CR9cX9JB.js: 207.02 KB (64.77 KB gzipped)
  - supabase-BTejuRT8.js: 121.69 KB (33.37 KB gzipped)

### Optimization Tips

1. **Code Splitting**: Already implemented via React lazy loading
2. **Tree Shaking**: Already handled by Vite
3. **Compression**: Handled by Vercel automatically
4. **CDN**: Vercel Edge Network worldwide

## Security Best Practices

### ⚠️ Service Role Key Exposure

**Current Setup**: Service role key is in frontend environment variables.

**Risk**: Moderate - key can be extracted from browser

**Mitigation**:
1. Short-term: Keep key secure, rotate regularly
2. Long-term: Move admin operations to Edge Functions

**Recommended Architecture** (Future):

```
Frontend → Vercel Edge Functions → Supabase
                ↓
         (Service key here)
```

Create Edge Functions for:
- User creation
- User deletion
- Role updates
- Session management

## Monitoring

### Vercel Analytics

Enable in Project Settings:
- Web Analytics (free)
- Speed Insights (free)

### Logs

View deployment logs:
```bash
vercel logs
```

## Rollback

If something goes wrong:

```bash
# List deployments
vercel ls

# Promote previous deployment
vercel promote <deployment-url>
```

Or use Vercel Dashboard:
- Go to Deployments
- Find working deployment
- Click "Promote to Production"

## Support

- Vercel Docs: https://vercel.com/docs
- Supabase Docs: https://supabase.com/docs
- GitHub Issues: Create issue in your repo

---

**Last Updated**: 2025-10-01
**Deployment**: Vercel
**Framework**: React + Vite + TypeScript
