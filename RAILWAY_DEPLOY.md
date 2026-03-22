# MediTrack - Railway Deployment Guide

## Architecture for Railway

You'll deploy **2 separate Railway services**:

1. **Backend (API)** - Express server at `apps/api`
2. **Frontend (Web)** - Next.js app at `apps/web`

Plus a **PostgreSQL database** addon.

---

## Step-by-Step Deployment

### 1. Create a New Railway Project

1. Go to [railway.app](https://railway.app)
2. Create a new project

### 2. Add PostgreSQL Database

1. Click **"Add Service"** → **"Database"** → **"PostgreSQL"**
2. Railway will create the database and provide `DATABASE_URL`

### 3. Deploy Backend (API)

1. Click **"Add Service"** → **"GitHub Repo"**
2. Select your repository
3. Set **Root Directory** to: `apps/api`
4. Railway will auto-detect the `railway.toml` configuration

**Set these environment variables:**
| Variable | Value |
|----------|-------|
| `DATABASE_URL` | Click "Reference" → Select PostgreSQL → `DATABASE_URL` |
| `JWT_SECRET` | Generate a strong random string (32+ chars) |
| `FRONTEND_URL` | (Set after frontend is deployed) |
| `PORT` | Railway sets this automatically |

5. Deploy!

### 4. Deploy Frontend (Web)

1. Click **"Add Service"** → **"GitHub Repo"**
2. Select the same repository
3. Set **Root Directory** to: `apps/web`

**Set these environment variables:**
| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_API_URL` | Your backend URL (e.g., `https://api-production-xxxx.up.railway.app`) |

5. Deploy!

### 5. Update Backend CORS

After the frontend is deployed:
1. Go back to the **API service**
2. Add/update `FRONTEND_URL` with your frontend URL (e.g., `https://web-production-xxxx.up.railway.app`)
3. Redeploy

---

## Run Database Migrations

After backend deploys, run migrations via Railway CLI or the Railway dashboard:

```bash
# Using Railway CLI
railway run npx prisma migrate deploy
railway run npx prisma db seed
```

Or use the Railway dashboard → Backend service → **"Database"** tab → Run command.

---

## Environment Variables Summary

### Backend (`apps/api`)
```
DATABASE_URL=postgresql://... (from Railway PostgreSQL)
JWT_SECRET=your-secure-random-string
JWT_EXPIRES_IN=7d
FRONTEND_URL=https://your-frontend.up.railway.app
PORT=(auto-set by Railway)
EXPIRY_WARNING_DAYS=30
LOW_STOCK_THRESHOLD=10
```

### Frontend (`apps/web`)
```
NEXT_PUBLIC_API_URL=https://your-backend.up.railway.app
```

---

## Custom Domain (Optional)

1. Go to your service settings
2. Click **"Custom Domain"**
3. Add your domain and configure DNS

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Database connection error | Check `DATABASE_URL` variable is set correctly |
| CORS errors | Verify `FRONTEND_URL` matches your actual frontend URL |
| API 404 errors | Ensure `NEXT_PUBLIC_API_URL` includes the full backend URL |
| Build fails | Check the build logs in Railway dashboard |

---

## Local Development

For local development, copy the example env files:

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

Then update `apps/api/.env` with your local PostgreSQL connection string.
