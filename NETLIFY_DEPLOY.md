# 🚀 Deploying MediTrack to Netlify

This guide covers deploying the **MediTrack Next.js frontend** (`apps/web`) to Netlify.

> **Note:** The Express API backend (`apps/api`) must be deployed separately to a service like Railway, Render, or Fly.io that supports Node.js servers.

---

## Prerequisites

- A [Netlify account](https://app.netlify.com/signup)
- Your API backend deployed and running (e.g., on Railway)
- This repository pushed to GitHub/GitLab/Bitbucket

---

## Step 1: Connect Your Repository

1. Go to [Netlify Dashboard](https://app.netlify.com/)
2. Click **"Add new site"** → **"Import an existing project"**
3. Connect your GitHub/GitLab/Bitbucket account
4. Select the **meditrack** repository

---

## Step 2: Configure Build Settings

The `netlify.toml` file in the repository root handles most of the configuration automatically. However, verify these settings during setup:

| Setting          | Value                                              |
| ---------------- | -------------------------------------------------- |
| **Base directory** | `apps/web`                                        |
| **Build command**  | `npm install --prefix ../.. && npx next build`    |
| **Publish directory** | `apps/web/.next`                               |

> These should be auto-detected from `netlify.toml`.

---

## Step 3: Set Environment Variables

In **Netlify Dashboard** → **Site Settings** → **Environment Variables**, add:

| Variable               | Value                          | Example                                |
| ---------------------- | ------------------------------ | -------------------------------------- |
| `NEXT_PUBLIC_API_URL`  | Your deployed API backend URL  | `https://meditrack-api.railway.app`    |

### Important Notes:
- **Do NOT include a trailing slash** in the URL
- The URL should be the base URL of your API (the one serving `/api/*` routes)
- If your API uses a different path prefix, update the redirect rules in `netlify.toml`

---

## Step 4: Install the Next.js Plugin

The `netlify.toml` already declares the `@netlify/plugin-nextjs` plugin. Netlify will install it automatically during the build process.

If you encounter plugin issues, you can also install it manually:
1. Go to **Netlify Dashboard** → **Plugins**
2. Search for **"Next.js"**
3. Click **Install**

---

## Step 5: Deploy

1. Click **"Deploy site"**
2. Netlify will run the build and deploy automatically
3. Future pushes to your main branch will trigger automatic deployments

---

## How the API Proxy Works

Instead of the Next.js `rewrites` in `next.config.js` (which work on Vercel), Netlify uses **redirect rules** defined in `netlify.toml`:

```
/api/* → YOUR_BACKEND_URL/api/*
```

This means:
- Frontend calls to `/api/auth/login` are proxied to `https://your-api.railway.app/api/auth/login`
- No CORS issues since the proxy makes it a same-origin request from the browser's perspective
- The `NEXT_PUBLIC_API_URL` environment variable controls the target

---

## Troubleshooting

### Build Fails with "Module not found"
- Ensure all dependencies are installed correctly
- Check that the base directory is set to `apps/web`
- Verify the build command includes `npm install --prefix ../..`

### API Requests Return 404
- Verify `NEXT_PUBLIC_API_URL` is set correctly in Netlify environment variables
- Ensure your API backend is running and accessible
- Check that the API URL doesn't have a trailing slash

### CORS Errors
- The Netlify redirects should handle proxying, eliminating CORS issues
- If you still see CORS errors, add your Netlify site URL to the API's `FRONTEND_URL` environment variable

### Deploy Previews
- Netlify automatically creates deploy previews for pull requests
- For deploy previews to work with the API, ensure your API backend's CORS settings accept the Netlify preview URLs (usually `*.netlify.app`)

---

## Useful Netlify CLI Commands

Install the Netlify CLI for local testing:

```bash
npm install -g netlify-cli
```

```bash
# Link to your site
netlify link

# Local development with Netlify features
netlify dev

# Manual deploy (useful for testing)
netlify deploy

# Production deploy
netlify deploy --prod

# Check site status
netlify status
```

---

## Architecture Overview

```
┌─────────────────────────────────────────────┐
│                  Netlify                     │
│  ┌───────────────────────────────────────┐   │
│  │   Next.js Frontend (apps/web)         │   │
│  │   - SSR / Static pages                │   │
│  │   - Netlify Edge Functions            │   │
│  └───────────────────────────────────────┘   │
│                    │                          │
│          /api/* redirect (proxy)             │
│                    │                          │
└────────────────────┼─────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────┐
│         Railway / Render / Fly.io            │
│  ┌───────────────────────────────────────┐   │
│  │   Express API Backend (apps/api)      │   │
│  │   - REST API                          │   │
│  │   - Prisma + Database                 │   │
│  └───────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```
