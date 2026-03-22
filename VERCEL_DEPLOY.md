# MediTrack - Vercel Deployment Guide

## Architecture

- **Frontend (Web)** — Next.js app deployed on **Vercel** (`apps/web`)
- **Backend (API)** — Express + Prisma server deployed on **Railway/Render** (`apps/api`)
- **Database** — PostgreSQL (Railway addon or external provider)

> Vercel hosts the Next.js frontend. The backend API must be deployed separately since Vercel is optimized for frontend/serverless workloads.

---

## Step 1: Deploy the Backend (API) First

Deploy `apps/api` to **Railway**, **Render**, or any Node.js hosting platform.

### Using Railway:
1. Go to [railway.app](https://railway.app) and create a new project
2. Add a **PostgreSQL Database** → Railway provides `DATABASE_URL`
3. Add a new service → Select your GitHub repo
4. Set **Root Directory** to `apps/api`
5. Set these **Environment Variables**:

| Variable              | Value                                              |
|-----------------------|----------------------------------------------------|
| `DATABASE_URL`        | Reference Railway PostgreSQL → `DATABASE_URL`      |
| `JWT_SECRET`          | A strong random string (32+ characters)            |
| `JWT_EXPIRES_IN`      | `7d`                                               |
| `FRONTEND_URL`        | *(Set after Vercel deployment — see Step 3)*       |
| `EXPIRY_WARNING_DAYS` | `30`                                               |
| `LOW_STOCK_THRESHOLD` | `10`                                               |

6. Deploy and note the backend URL (e.g., `https://api-production-xxxx.up.railway.app`)

### Run Database Migrations:
```bash
railway run npx prisma migrate deploy
railway run npx prisma db seed
```

---

## Step 2: Deploy Frontend on Vercel

### Option A: Via Vercel Dashboard (Recommended)
1. Go to [vercel.com](https://vercel.com) and click **"Add New Project"**
2. Import your GitHub repository
3. Vercel will auto-detect the `vercel.json` configuration
4. Set **Environment Variables**:

| Variable                | Value                                                    |
|-------------------------|----------------------------------------------------------|
| `NEXT_PUBLIC_API_URL`   | Your backend URL (e.g., `https://api-xxxx.up.railway.app`) |

5. Click **Deploy**!

### Option B: Via Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy from the project root
cd meditrack
vercel

# Follow the prompts, then set the environment variable
vercel env add NEXT_PUBLIC_API_URL
# Enter your backend URL when prompted

# Deploy to production
vercel --prod
```

---

## Step 3: Update Backend CORS

After the Vercel frontend is deployed:

1. Copy your Vercel frontend URL (e.g., `https://meditrack.vercel.app`)
2. Go to your **backend hosting dashboard** (Railway/Render)
3. Set `FRONTEND_URL` to your Vercel URL
4. Redeploy the backend

---

## Environment Variables Summary

### Frontend on Vercel (`apps/web`)
```
NEXT_PUBLIC_API_URL=https://your-backend.up.railway.app
```

### Backend on Railway/Render (`apps/api`)
```
DATABASE_URL=postgresql://... (from hosting provider)
JWT_SECRET=your-secure-random-string
JWT_EXPIRES_IN=7d
FRONTEND_URL=https://your-app.vercel.app
PORT=(auto-set by platform)
EXPIRY_WARNING_DAYS=30
LOW_STOCK_THRESHOLD=10
```

---

## How It Works

The Next.js app uses **rewrites** in `next.config.js` to proxy API calls:

```
Browser → /api/auth/login → Vercel (rewrites) → https://your-backend.up.railway.app/api/auth/login
```

This means:
- No CORS issues from the browser (requests go to the same domain)
- The `NEXT_PUBLIC_API_URL` environment variable tells Next.js where to forward API requests
- The backend still needs `FRONTEND_URL` set for any server-side CORS headers

---

## Custom Domain (Optional)

### Vercel:
1. Go to Project Settings → **Domains**
2. Add your custom domain
3. Configure DNS as instructed by Vercel

### Backend:
1. Update `FRONTEND_URL` to your custom domain
2. Redeploy

---

## Troubleshooting

| Issue                    | Solution                                                      |
|--------------------------|---------------------------------------------------------------|
| API calls return 404     | Ensure `NEXT_PUBLIC_API_URL` is set correctly in Vercel       |
| CORS errors              | Set `FRONTEND_URL` on the backend to your Vercel URL          |
| Build fails on Vercel    | Check build logs in Vercel dashboard                          |
| Auth not working         | Verify `JWT_SECRET` is set on the backend                     |
| Database errors          | Check `DATABASE_URL` on the backend                           |
| Blank page after deploy  | Ensure the build completes — check for TypeScript errors      |
