# Deploying Solar ERP Frontend to Cloudflare Pages

This guide provides step-by-step instructions for deploying the **Solar ERP Next.js Frontend** to **Cloudflare Pages**.

---

## 📋 Prerequisites

1. **Cloudflare Account**: [Sign up for a free Cloudflare account](https://dash.cloudflare.com/sign-up) if you don't already have one.
2. **Node.js & npm**: Installed locally (v18+ recommended).
3. **Deployed Backend API**: Your backend API running on Cloudflare Workers (e.g. `https://solar-erp-backend.siddheshjungade.workers.dev`).

---

## ⚙️ Step 1: Configure Next.js for Static Export

Ensure [`frontend/next.config.ts`](file:///Users/sid/workspace/erp/frontend/next.config.ts) is configured for static export (`output: 'export'`).

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
};

export default nextConfig;
```

---

## 🌐 Step 2: Configure Environment Variables

Set your production backend API URL in [`frontend/.env`](file:///Users/sid/workspace/erp/frontend/.env):

```env
NEXT_PUBLIC_BACKEND_URL=https://solar-erp-backend.siddheshjungade.workers.dev
```

---

## 🛠️ Step 3: Build the Static Application

From the `frontend` directory, run the build command:

```bash
cd frontend
npm run build
```

This compiles your TypeScript & Next.js pages into static assets inside the `out/` directory.

---

## 🚀 Step 4: Deploy to Cloudflare Pages

You can deploy using either the **Wrangler CLI** or **Cloudflare Dashboard (Git)**.

### Option A: Deploy via Wrangler CLI (Direct Command Line)

1. **Create the Pages project** (only needed once):
   ```bash
   npx wrangler pages project create solar-erp-frontend --production-branch main
   ```

2. **Deploy the `out` directory**:
   ```bash
   npx wrangler pages deploy out --project-name solar-erp-frontend
   ```

3. Once complete, Wrangler will provide your live Pages URL:
   ```
   ✨ Deployment complete! Take a look at your site: https://solar-erp-frontend-bxo.pages.dev
   ```

---

### Option B: Deploy via Cloudflare Dashboard (Automatic Git Deploys)

1. Push your repository to **GitHub** or **GitLab**.
2. Log into the [Cloudflare Dashboard](https://dash.cloudflare.com/).
3. Navigate to **Workers & Pages** > **Create Application** > **Pages** > **Connect to Git**.
4. Select your repository and branch (`main`).
5. Configure the build settings:
   - **Framework preset**: `Next.js (Static Export)`
   - **Build command**: `npm run build`
   - **Build output directory**: `out`
   - **Root directory**: `frontend`
6. Add Environment Variables:
   - `NEXT_PUBLIC_BACKEND_URL` = `https://solar-erp-backend.siddheshjungade.workers.dev`
7. Click **Save and Deploy**.

---

## 🔗 Step 5: Post-Deployment Configuration

After your frontend is live (e.g., `https://solar-erp-frontend-bxo.pages.dev`):

### 1. Update Backend `FRONTEND_URL` Variable
Update [`backend/wrangler.json`](file:///Users/sid/workspace/erp/backend/wrangler.json) so the backend knows where to redirect after Google OAuth:

```json
"vars": {
  "FRONTEND_URL": "https://solar-erp-frontend-bxo.pages.dev"
}
```

Redeploy the backend Worker:
```bash
cd backend
npm run deploy
```

### 2. Update Google Cloud Console Authorized Origins
1. Go to [Google Cloud Console Credentials](https://console.cloud.google.com/apis/credentials).
2. Select your OAuth 2.0 Client ID.
3. Under **Authorized JavaScript origins**, add your live frontend URL:
   ```
   https://solar-erp-frontend-bxo.pages.dev
   ```
4. Save changes.
