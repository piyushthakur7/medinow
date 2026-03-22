# MediNow - Railway Deployment Guide

## Overview

This guide explains how to deploy the entire **MediNow Monorepo** (frontend + backend + database) to **Railway**.

---

## Prerequisites
- A [Railway Account](https://railway.app)
- Your project pushed to GitHub

---

## 🏗️ Deployment Strategy

We will use Railway's **Root Directory** feature to deploy two separate services from the same repository:
1. **API Service** (`apps/api`)
2. **Web Service** (`apps/web`)

---

## 1. Setup PostgreSQL Database

1. Click **"New Project"** → **"Provision PostgreSQL"**
2. Railway will create a database and provide a `DATABASE_URL` environment variable.

---

## 2. Deploy the API Backend

1. Click **"New"** → **"GitHub Repo"** → Select your repo
2. Complete the setup and go to the **Service Settings**
3. Set **Root Directory** to `apps/api`
4. Set the following **Variables**:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` (Reference your Postgres service) |
| `JWT_SECRET` | A strong random string |
| `FRONTEND_URL` | Your frontend URL (e.g., `https://medinow.up.railway.app`) |

5. Click **Deploy**.

---

## 3. Deploy the Next.js Frontend

1. Click **"New"** → **"GitHub Repo"** → Select your repo again
2. Go to **Service Settings**
3. Set **Root Directory** to `apps/web`
4. Set the following **Variables**:

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_API_URL` | Your API URL (e.g., `https://api-medinow.up.railway.app`) |

5. Click **Deploy**.

---

## 4. Final Verification

- Visit your frontend URL
- Check if the Signup/Login works (communicating with the API)
- Verify that data persists in the database

---

## Troubleshooting

- **Build Failures**: Check the logs. Ensure `pnpm` or `npm` versions match your local environment.
- **Connection Refused**: Verify that `FRONTEND_URL` and `NEXT_PUBLIC_API_URL` use the correct protocols (`https://`).
