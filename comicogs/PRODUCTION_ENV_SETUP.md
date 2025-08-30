# 🚀 Production Environment Variables Setup

## Critical Environment Variables for Vercel Deployment

To fix the deployment issues, you need to configure these environment variables in your **Vercel Dashboard**:

### 🔴 **REQUIRED - Must Fix These**

#### 1. **Database Configuration**
```bash
DATABASE_URL="your-production-database-url-here"
```

**Options:**
- **Vercel Postgres** (Recommended): `postgres://default:xxx@xxx-pooler.us-east-1.postgres.vercel-storage.com:5432/verceldb`
- **Supabase**: `postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres`  
- **Railway**: `postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/railway`
- **PlanetScale**: `mysql://[USERNAME]:[PASSWORD]@[HOST]/[DATABASE]?sslaccept=strict`

#### 2. **Application URLs**
```bash
NODE_ENV="production"
NEXTAUTH_URL="https://comicogs-01.vercel.app"
NEXT_PUBLIC_API_URL="https://comicogs-01.vercel.app/api"
CORS_ORIGIN="https://comicogs-01.vercel.app"
```

#### 3. **Authentication Secrets**
```bash
NEXTAUTH_SECRET="generate-a-secure-32-character-secret"
JWT_SECRET="generate-another-secure-32-character-secret"
```

**Generate secrets:**
```bash
# Method 1: OpenSSL
openssl rand -base64 32

# Method 2: Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 🟡 **OPTIONAL - Redis for Performance**
```bash
REDIS_URL="your-redis-connection-string"
```

**Options:**
- **Vercel KV**: `redis://default:[PASSWORD]@[HOST]:[PORT]`
- **Upstash**: `redis://default:[PASSWORD]@[HOST]:[PORT]`
- **Railway Redis**: `redis://default:[PASSWORD]@[HOST]:[PORT]`

### 🟢 **RECOMMENDED - Feature Flags**
```bash
FLAG_PAYMENTS="on"
FLAG_SEARCH="on"  
FLAG_EMAIL="on"
FLAG_UPLOADS="on"
FLAG_EXPORTS="on"
FLAG_IMPORTS="on"
FLAG_ALERTS="on"
FLAG_WANTLIST="on"
EXPOSE_FEATURE_FLAGS="false"
```

## 📋 **Step-by-Step Setup**

### **Step 1: Set Up Database**

Choose one option:

#### Option A: Vercel Postgres (Easiest)
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project → **Storage** tab
3. **Create** → **Postgres Database**
4. Copy the connection string to `DATABASE_URL`

#### Option B: Supabase (Full-featured)
1. Create account at [Supabase](https://supabase.com)
2. **New Project** → Get connection string
3. Format: `postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres`

#### Option C: Railway (Developer-friendly)
1. Create account at [Railway](https://railway.app)
2. **New Project** → **Add PostgreSQL**
3. Copy connection string from **Variables** tab

### **Step 2: Configure Environment Variables in Vercel**

1. Go to **Vercel Dashboard** → Your Project
2. **Settings** → **Environment Variables**
3. Add each variable:

```bash
DATABASE_URL → your-database-connection-string
NODE_ENV → production
NEXTAUTH_URL → https://comicogs-01.vercel.app
NEXTAUTH_SECRET → your-generated-secret
JWT_SECRET → your-generated-jwt-secret
NEXT_PUBLIC_API_URL → https://comicogs-01.vercel.app/api
CORS_ORIGIN → https://comicogs-01.vercel.app
```

### **Step 3: Deploy**

1. **Push to GitHub** (if not already):
```bash
git add .
git commit -m "fix: production environment variables"
git push origin main
```

2. **Trigger Deployment**:
   - Vercel will auto-deploy from GitHub
   - Or manually: **Deployments** → **Redeploy**

### **Step 4: Verify**

After deployment, check:
- ✅ Build succeeds without environment errors
- ✅ Application loads at `https://comicogs-01.vercel.app`  
- ✅ Database connections work (no localhost errors)

## 🔧 **Troubleshooting**

### **Common Issues:**

#### ❌ "localhost" Connection Errors
**Problem:** `DATABASE_URL` or `REDIS_URL` pointing to localhost
**Solution:** Update to production database URL

#### ❌ CORS Errors  
**Problem:** `CORS_ORIGIN` set to localhost
**Solution:** Set to `https://comicogs-01.vercel.app`

#### ❌ Authentication Issues
**Problem:** `NEXTAUTH_URL` set to localhost  
**Solution:** Set to `https://comicogs-01.vercel.app`

#### ❌ Build Fails with "Environment Variable Missing"
**Problem:** Required env vars not set in Vercel
**Solution:** Add all variables in Vercel Dashboard → Settings → Environment Variables

## 🚀 **Quick Setup Commands**

```bash
# 1. Generate secrets
echo "NEXTAUTH_SECRET=$(openssl rand -base64 32)"
echo "JWT_SECRET=$(openssl rand -base64 32)"

# 2. Test build locally with production env
NODE_ENV=production npm run build

# 3. Deploy to Vercel
vercel --prod
```

Once you configure these environment variables in your Vercel Dashboard and redeploy, your application should build and run successfully in production!