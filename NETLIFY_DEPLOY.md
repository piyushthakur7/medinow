# 🚀 Deploying MediNow to Netlify

This guide covers deploying the **MediNow Next.js frontend** (`apps/web`) to Netlify.

---

## Prerequisites
- A [Netlify Account](https://netlify.com)
- Your project pushed to GitHub

---

## 🏗️ Deployment Steps

1. **Login to Netlify** and click **"Add New Site"** → **"Import from GitHub"**.
2. Select your repository.
3. Configure the following **Build Settings**:
    - **Base Directory**: `apps/web`
    - **Build Command**: `npm run build`
    - **Publish Directory**: `.next` (Netlify should auto-detect this)
4. Set **Environment Variables**:

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_API_URL` | Your API URL (e.g., `https://api-medinow.up.railway.app`) |

5. Click **Deploy**.

---

## 🌩️ Netlify Functions (Optional)

If you wanted to deploy the backend to Netlify as well, you would need to use **Netlify Functions**. However, it is **strongly recommended** to host the Express API on **Railway** or **Render** for better performance.

---

## Troubleshooting

- **404 on API Routes**: Ensure `NEXT_PUBLIC_API_URL` is set correctly.
- **Rewrites Not Working**: Verify that the Netlify Next.js adapter is installed and configured.
