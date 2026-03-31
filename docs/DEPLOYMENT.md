# Deployment Guide

Everything you need to go from zero to a working CTO cockpit. Estimated time: 20-30 minutes.

**What you'll end up with:**
- n8n running on Render (free)
- Supabase database with schema applied (free)
- Dashboard hosted on GitHub Pages (free)
- PWA installable on your phone
- Total monthly cost: $0

---

## Prerequisites

- GitHub account
- Supabase account (free at [supabase.com](https://supabase.com))
- Render account (free at [render.com](https://render.com))
- Optional: Cloudflare account for custom domain (free at [cloudflare.com](https://cloudflare.com))
- Optional: Anthropic API key for Claude classification ([console.anthropic.com](https://console.anthropic.com))
- Optional: UptimeRobot account to keep n8n warm ([uptimerobot.com](https://uptimerobot.com))

---

## Step 1: Fork the Repository

1. Go to [github.com/ProyectoAna/zero-cost-ops](https://github.com/ProyectoAna/zero-cost-ops)
2. Click **Fork** (top right)
3. Name it `zero-cost-ops` (or anything you like)
4. Clone locally:

```bash
git clone https://github.com/YOUR_USERNAME/zero-cost-ops.git
cd zero-cost-ops
```

---

## Step 2: Set Up Supabase

### 2.1 Create project

1. Sign in to [supabase.com](https://supabase.com)
2. Click **New project**
3. Choose a name and region (pick EU if you need GDPR compliance)
4. Wait ~2 minutes for provisioning

### 2.2 Apply schema

1. In your project dashboard, go to **SQL Editor**
2. Click **New query**
3. Open `schema/supabase-schema.sql` from this repo
4. Paste the entire file and click **Run**
5. Verify: go to **Table Editor** — you should see 5 tables

### 2.3 Copy credentials

Go to **Settings > API** and copy:

- **Project URL**: `https://xxxxxxxxxxxx.supabase.co`
- **anon public key**: `eyJ...` (safe to embed in frontend)
- **service_role key**: `eyJ...` (keep secret — only for n8n)

Store these somewhere safe. You'll need them in the next steps.

---

## Step 3: Deploy n8n on Render

### 3.1 Create the web service

1. Sign in to [render.com](https://render.com)
2. Click **New > Web Service**
3. Choose **Deploy an existing image from a registry**
4. Image URL: `docker.io/n8nio/n8n:latest`
5. Name: `zero-cost-ops-n8n` (or your preference)
6. Region: Choose closest to you
7. Instance type: **Free**
8. Click **Create Web Service**

### 3.2 Add environment variables

In your Render service, go to **Environment** and add:

```
N8N_BASIC_AUTH_ACTIVE         = true
N8N_BASIC_AUTH_USER           = admin
N8N_BASIC_AUTH_PASSWORD       = [choose a strong password]
N8N_HOST                      = 0.0.0.0
N8N_PORT                      = 5678
N8N_PROTOCOL                  = https
WEBHOOK_URL                   = https://YOUR-SERVICE-NAME.onrender.com
N8N_EDITOR_BASE_URL           = https://YOUR-SERVICE-NAME.onrender.com
SUPABASE_URL                  = https://YOUR-PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY     = [your service role key]
```

### 3.3 Wait for deployment

Render will build and deploy the container. First deploy takes 3-5 minutes. Once running, visit `https://YOUR-SERVICE.onrender.com` and log in with the credentials you set.

### 3.4 Keep n8n warm (prevent sleep)

Free Render instances sleep after 15 minutes of inactivity. To prevent this:

1. Create a free account at [uptimerobot.com](https://uptimerobot.com)
2. Click **Add New Monitor**
3. Type: **HTTP(s)**
4. URL: `https://YOUR-N8N-INSTANCE.onrender.com/healthz`
5. Monitoring interval: **5 minutes**

This keeps your n8n instance always-on at zero cost.

---

## Step 4: Import n8n Workflows

### 4.1 Import WF-01

1. In n8n, go to **Workflows** (left sidebar)
2. Click the **⋮** menu > **Import from File**
3. Select `workflows/WF-01-ingestion-pipeline.json`
4. The workflow opens in the editor

### 4.2 Configure credentials in WF-01

Click the **Supabase Insert** node:
1. Under Credentials, click **+ Create New**
2. Name: `Supabase API`
3. Host: `https://YOUR-PROJECT.supabase.co`
4. Service Role Secret: `[your service role key]`
5. Click **Save**

If using Claude AI classification, click the **Claude API Classification** node:
1. Under Credentials, click **+ Create New**
2. Select **Anthropic** credential type
3. API Key: `[your Anthropic key]`
4. Click **Save**

### 4.3 Update the Trigger WF-02 node

1. Click the **Trigger WF-02** node
2. Update the URL to: `https://YOUR-N8N-INSTANCE.onrender.com/webhook/wf02-crosslink`
3. If you don't have a cross-linking workflow, delete this node

### 4.4 Activate WF-01

1. Click the toggle in the top-right corner of the editor
2. Status should show **Active**
3. Copy the webhook URL shown in the Webhook Trigger node

### 4.5 Import and configure WF-04

Repeat the import process for `workflows/WF-04-timeline-engine.json`. Apply the same Supabase credentials. Activate the workflow.

### 4.6 Test WF-01

```bash
curl -X POST https://YOUR-N8N-INSTANCE.onrender.com/webhook/wf01-ingest \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Testing the ingestion pipeline. Dashboard deployed successfully.",
    "source": "manual",
    "user_id": "test"
  }'
```

Expected response:
```json
{"status": "success", "file_name": "auto_manual_1234567890"}
```

Check Supabase > Table Editor > `metadata` — your test entry should appear.

---

## Step 5: Configure GitHub Pages

### 5.1 Enable Pages

1. In your forked GitHub repo, go to **Settings > Pages**
2. Source: **Deploy from a branch**
3. Branch: **main** / **/ (root)**
4. Click **Save**

GitHub will give you a URL like `https://YOUR_USERNAME.github.io/zero-cost-ops`.

The `.github/workflows/deploy.yml` in this repo handles automatic deployment on every push to `main`.

### 5.2 Configure the dashboard

Edit `dashboard/cto-cockpit.html` and update the `CONFIG` object:

```javascript
const CONFIG = {
  statusEndpoint: 'https://YOUR-N8N-INSTANCE.onrender.com/webhook/status',
  supabaseUrl: 'https://YOUR-PROJECT.supabase.co',
  supabaseKey: 'your-anon-key',  // anon key is safe here — RLS protects data
  // ...
};
```

Edit `dashboard/system-dashboard.html` and update:

```javascript
const API = 'https://YOUR-N8N-INSTANCE.onrender.com/webhook/system';
```

Commit and push:

```bash
git add dashboard/
git commit -m "Configure dashboard endpoints"
git push origin main
```

GitHub Actions will deploy automatically. Check the **Actions** tab to monitor progress.

---

## Step 6: Set Up Custom Domain (Optional)

If you want `dashboard.yourdomain.com` instead of `username.github.io/zero-cost-ops`:

### 6.1 Cloudflare DNS setup

1. Add your domain to Cloudflare (free plan)
2. Go to **DNS > Records > Add record**
3. Type: **CNAME**
4. Name: `dashboard` (or whatever subdomain you want)
5. Target: `YOUR_USERNAME.github.io`
6. Proxy: **DNS only** (orange cloud off — GitHub Pages handles HTTPS)

### 6.2 GitHub Pages custom domain

1. In your repo, go to **Settings > Pages**
2. Custom domain: `dashboard.yourdomain.com`
3. Check **Enforce HTTPS**

DNS propagation takes up to 24 hours, but usually under 5 minutes with Cloudflare.

---

## Step 7: Install as PWA

Once the dashboard is live, install it on your phone:

**iOS (Safari):**
1. Open the dashboard in Safari
2. Tap the **Share** button
3. Tap **Add to Home Screen**

**Android (Chrome):**
1. Open the dashboard in Chrome
2. Tap the **⋮** menu
3. Tap **Add to Home Screen**

You now have a zero-cost CTO cockpit on your home screen.

---

## Environment Variables Reference

| Variable | Where | Description |
|----------|-------|-------------|
| `N8N_BASIC_AUTH_USER` | Render | n8n login username |
| `N8N_BASIC_AUTH_PASSWORD` | Render | n8n login password |
| `WEBHOOK_URL` | Render | Your Render URL (for webhooks) |
| `SUPABASE_URL` | Render | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Render | Supabase service role key (secret) |
| `ANTHROPIC_API_KEY` | n8n credentials | Claude API key (optional) |
| `supabaseKey` in HTML | GitHub Pages | Supabase anon key (safe to expose) |

---

## Troubleshooting

**GitHub Pages not updating**
Check the **Actions** tab in your repo. If the workflow fails, check the error log. Most common issue: incorrect `path` in `upload-pages-artifact` step.

**n8n sleeping despite UptimeRobot**
Verify the UptimeRobot monitor is using the correct URL. The healthz endpoint should return 200. Check UptimeRobot logs for errors.

**Supabase not receiving data**
1. Verify the service role key is set in Render env vars
2. Check n8n workflow execution history for errors
3. Verify Supabase RLS policies allow inserts from authenticated users

**Dashboard showing "Endpoint DOWN"**
1. Verify n8n is running (visit your Render URL directly)
2. Check the workflow is Active
3. Verify the webhook path matches in both n8n and the dashboard config

**Claude API errors in WF-01**
1. Verify your Anthropic API key in n8n credentials
2. Check your Anthropic account for billing status
3. To disable Claude and use demo classification, remove the Claude API Classification node and hardcode placeholder values in Parse Classification
