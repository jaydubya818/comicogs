# 🚀 Vercel Deployment Checklist

## ✅ **Environment Variables to Set in Vercel Dashboard**

Go to **Vercel Dashboard** → **Your Project** → **Settings** → **Environment Variables** and add these:

### 🔴 **CRITICAL - Must Set These:**

```bash
NODE_ENV = production
NEXTAUTH_URL = https://comicogs-01.vercel.app
NEXT_PUBLIC_API_URL = https://comicogs-01.vercel.app/api
CORS_ORIGIN = https://comicogs-01.vercel.app
```

### 🔐 **Generated Secrets (Use These):**

```bash
NEXTAUTH_SECRET = hcq/CfZiV0DJc0blriZnALFlMyCQDx1xPDPu+FXKJTQ=
JWT_SECRET = owMyQ+7DYmZUtT1MNpena6ZJZWhw3D4Mzz0YeYxziF4=
```

### 🗄️ **Database (Choose One):**

#### Option A: Vercel Postgres (Recommended)
1. In Vercel Dashboard → **Storage** → **Create** → **Postgres**
2. Copy connection string to:
```bash
DATABASE_URL = postgres://default:xxx@xxx-pooler.us-east-1.postgres.vercel-storage.com:5432/verceldb
```

#### Option B: Supabase
1. Create project at [supabase.com](https://supabase.com)
2. Get connection string:
```bash
DATABASE_URL = postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres
```

#### Option C: Railway
1. Create project at [railway.app](https://railway.app)
2. Add PostgreSQL service:
```bash
DATABASE_URL = postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/railway
```

### 🟡 **Optional but Recommended:**

```bash
NEXT_TELEMETRY_DISABLED = 1
FLAG_PAYMENTS = on
FLAG_SEARCH = on
FLAG_EMAIL = on
FLAG_UPLOADS = on
FLAG_EXPORTS = on
FLAG_IMPORTS = on
FLAG_ALERTS = on
FLAG_WANTLIST = on
EXPOSE_FEATURE_FLAGS = false
```

### 🔗 **Optional Services:**

```bash
# Redis (for caching)
REDIS_URL = redis://default:[PASSWORD]@[HOST]:[PORT]

# Stripe (for payments)
STRIPE_PUBLISHABLE_KEY = pk_live_...
STRIPE_SECRET_KEY = sk_live_...
STRIPE_WEBHOOK_SECRET = whsec_...

# OAuth (for social login)
GOOGLE_CLIENT_ID = your-google-client-id
GOOGLE_CLIENT_SECRET = your-google-client-secret
GITHUB_CLIENT_ID = your-github-client-id
GITHUB_CLIENT_SECRET = your-github-client-secret
```

## 📋 **Step-by-Step Deployment**

### **Step 1: Set Environment Variables**
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. **Settings** → **Environment Variables**
4. Add all the variables above (at minimum the CRITICAL ones)

### **Step 2: Commit and Push**
```bash
git add .
git commit -m "fix: configure production environment variables"
git push origin main
```

### **Step 3: Deploy**
- Vercel will automatically deploy from your GitHub repository
- Or manually trigger: **Deployments** → **Redeploy**

### **Step 4: Verify Deployment**
1. Check build logs for errors
2. Visit `https://comicogs-01.vercel.app`
3. Verify database connections work
4. Test authentication flows

## 🐛 **Troubleshooting**

### **Build Fails:**
- ❌ **Error**: "localhost connection refused"
  - ✅ **Fix**: Set production `DATABASE_URL` in Vercel Dashboard

- ❌ **Error**: "NEXTAUTH_URL required" 
  - ✅ **Fix**: Set `NEXTAUTH_URL=https://comicogs-01.vercel.app`

- ❌ **Error**: "Invalid environment"
  - ✅ **Fix**: Set `NODE_ENV=production`

### **App Loads but Errors:**
- ❌ **CORS errors**
  - ✅ **Fix**: Set `CORS_ORIGIN=https://comicogs-01.vercel.app`

- ❌ **Database connection errors**
  - ✅ **Fix**: Verify `DATABASE_URL` is correct and accessible

- ❌ **Authentication doesn't work**
  - ✅ **Fix**: Verify `NEXTAUTH_SECRET` and `NEXTAUTH_URL` are set

## ✅ **Success Criteria**

After deployment, you should see:
- ✅ Build completes successfully (no environment errors)
- ✅ App loads at `https://comicogs-01.vercel.app`
- ✅ No console errors about localhost connections
- ✅ Database queries work (if using database features)
- ✅ Authentication flows work (if using auth features)

## 🎯 **Quick Test Commands**

```bash
# Test if environment is production-ready
NODE_ENV=production npm run build

# Generate new secrets if needed
./scripts/generate-secrets.sh
```

Once you complete these steps, your application should deploy successfully to Vercel! 🚀