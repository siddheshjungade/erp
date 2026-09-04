# Deploying Solar ERP Backend to Cloudflare Workers

This guide provides step-by-step instructions for deploying the **Solar ERP Backend** API to **Cloudflare Workers**.

---

## 📋 Prerequisites

1. **Cloudflare Account**: [Sign up for a free Cloudflare account](https://dash.cloudflare.com/sign-up) if you don't already have one.
2. **Google Cloud Console Access**: Access to your Google Cloud project to set Authorized Redirect URIs for the production worker domain.
3. **Node.js & npm**: Installed locally (v18+ recommended).

---

## 🚀 Step-by-Step Deployment Guide

### Step 1: Login to Cloudflare via Wrangler

Navigate to the `backend` directory and authenticate with Cloudflare:

```bash
cd backend
npx wrangler login
```
*This will open a browser window asking you to authorize Wrangler with your Cloudflare account.*

---

### Step 2: Set Production Environment Secrets

Cloudflare Workers manage sensitive environment variables as encrypted **Secrets**. Execute the following commands to configure your secrets:

```bash
# 1. Google OAuth Client ID
npx wrangler secret put GOOGLE_CLIENT_ID

# 2. Google OAuth Client Secret
npx wrangler secret put GOOGLE_CLIENT_SECRET

# 3. Secret key used for JWT signing
npx wrangler secret put JWT_SECRET

# 4. Production Frontend Web App URL (e.g., https://your-app.vercel.app or http://localhost:3000)
npx wrangler secret put FRONTEND_URL

# 5. Production Google Redirect URI
npx wrangler secret put GOOGLE_REDIRECT_URI
```

*When prompted, paste the respective secret values.*

> 💡 **Tip for Non-sensitive Variables**: Non-sensitive variables like `NODE_ENV = "production"` can also be added directly to `wrangler.json` under `vars`:
> ```json
> {
>   "vars": {
>     "NODE_ENV": "production"
>   }
> }
> ```

---

### Step 3: Deploy to Cloudflare Workers

Run the deploy command from the `backend` directory:

```bash
npm run deploy
```

Wrangler will bundle your TypeScript application and publish it to the Cloudflare Edge network.

Once deployment completes, Wrangler will output your live worker URL:
```
Uploaded solar-erp-backend (2.10 sec)
Published solar-erp-backend (4.50 sec)
  https://solar-erp-backend.<your-subdomain>.workers.dev
```

---

### Step 4: Update Google OAuth Redirect URI

1. Copy your live Cloudflare Worker URL (e.g., `https://solar-erp-backend.<your-subdomain>.workers.dev`).
2. Go to [Google Cloud Console Credentials](https://console.cloud.google.com/apis/credentials).
3. Select your OAuth 2.0 Client ID.
4. Under **Authorized redirect URIs**, add:
   ```
   https://solar-erp-backend.<your-subdomain>.workers.dev/api/auth/google/callback
   ```
5. Save changes.

---

### Step 5: Update Frontend Environment Variables

Update your Next.js frontend environment configuration (`frontend/.env.local` or hosting provider environment variables such as Vercel/Netlify):

```env
NEXT_PUBLIC_BACKEND_URL=https://solar-erp-backend.<your-subdomain>.workers.dev
```

---

## 🔍 Testing & Monitoring

### Health Check Verification
To test your deployed Worker, visit or curl the `/api/status` route:

```bash
curl https://solar-erp-backend.<your-subdomain>.workers.dev/api/status
```

Expected Output:
```json
{
  "status": "online",
  "message": "Solar ERP API is up and running on Cloudflare Workers!",
  "timestamp": "2026-09-04T08:35:00.000Z",
  "environment": "production"
}
```

### Live Log Tailing
Stream real-time request logs from your production Cloudflare Worker:

```bash
npx wrangler tail
```

---

## 🛠️ Local Development Command

To run the Worker locally with live reloading and edge emulation:

```bash
npm run dev
```
Access local server at `http://localhost:5000`.
