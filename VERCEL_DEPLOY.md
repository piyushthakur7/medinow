# MediNow - Vercel Deployment Guide (Frontend Only)

This project is now a standalone frontend application that uses mock data for all operations. No separate backend or database deployment is required.

## Quick Start: Deploy to Vercel

### Option A: Via Vercel Dashboard (Recommended)
1. Go to [vercel.com](https://vercel.com) and click **"Add New Project"**
2. Import your GitHub repository
3. Vercel will auto-detect the Next.js application in `apps/web`
4. **Project Settings**:
   - **Framework Preset**: Next.js
   - **Root Directory**: `apps/web`
5. Click **Deploy**!

### Option B: Via Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy from the project root
vercel --prod
```

## Architecture Summary

- **Frontend**: Next.js (located in `apps/web`)
- **Data**: Mock API (located in `apps/web/src/lib/mock-api.ts`)
- **Backend**: None (Removed for simplified deployment)

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Build fails | Ensure you have set the **Root Directory** to `apps/web` in Vercel settings. |
| Missing features | This version uses mock data. Ensure `MOCK_ENABLED` is true in `apps/web/src/lib/api.ts` (it should be by default). |

## Development

To run locally:
```bash
npm run dev
```
This will start the Next.js development server on `http://localhost:3000`.
