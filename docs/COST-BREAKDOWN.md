# Cost Breakdown

This document explains exactly what "free" means for each service — the real limits, where you'll hit them, and when you'd actually need to pay.

**Current cost: $0/month** (Claude API optional and pay-as-you-go)

---

## Service-by-Service Analysis

### n8n on Render

**Free tier:** 750 compute hours/month

**What you actually get:**
- 1 web service, free forever
- 512MB RAM
- 0.1 CPU
- Shared infrastructure
- Automatic HTTPS

**The catch — instance sleep:**
Render's free tier spins down instances after **15 minutes of inactivity**. Cold starts take 30-60 seconds, which means the first webhook after a period of quiet will time out.

**The fix:** UptimeRobot pings `/healthz` every 5 minutes. This keeps the instance awake continuously, well within the 750 hour/month limit (720 hours = 30 days × 24 hours — it's fine).

**When to upgrade:**
- You need persistent storage (n8n uses SQLite by default — data is lost on redeploy/restart)
- You need execution history preserved across deploys
- You're running >20 concurrent workflow executions

Render's Starter plan is $7/month and removes the sleep behavior. Worth it eventually.

**Alternative:** n8n Cloud has a free community tier. Self-hosting on Render gives more control.

---

### Supabase

**Free tier limits:**

| Resource | Free limit | Notes |
|----------|------------|-------|
| Database size | 500MB | More than enough for metadata at scale |
| API requests | 50,000/month | ~1,600/day — generous |
| Auth MAUs | 50,000/month | Monthly active users |
| Storage | 1GB | Not needed for this system |
| Bandwidth | 5GB/month | Egress from API |
| Edge Functions | 500K invocations/month | Not used in this system |
| Projects | 2 (free tier) | One production, one staging |

**At typical solo founder scale:**
- Metadata entries: 200-500/month
- API calls from dashboard (polling every 60s): ~2,000/month
- API calls from n8n workflows: ~1,000/month
- **Total: ~3,000/month — well under 50K limit**

**When you'll hit limits:**
- Storage: ~2 million metadata entries at ~250 bytes each = 500MB. Not a concern.
- API calls: If you build a public-facing app with 1,000+ daily active users, you'll start burning 50K calls in days.

**When to upgrade:**
- You build a product with user-facing API calls
- You hit 40K calls/month consistently (upgrade before you hit 50K to avoid service interruption)
- You need read replicas or PITR backups

Supabase Pro is $25/month. Includes 8GB storage, 250K API calls, daily backups. A good upgrade path.

**Free project pausing:**
Supabase pauses free projects after **1 week of inactivity**. To prevent this, have your n8n workflow ping Supabase at least once per week (WF-01's UptimeRobot keep-alive also calls n8n, which calls Supabase, which counts).

---

### GitHub Pages

**Free tier limits:**

| Resource | Limit |
|----------|-------|
| Bandwidth | 100GB/month |
| Storage | 1GB per repo |
| Build minutes | 2,000 minutes/month (GitHub Actions) |
| Builds | Soft limit: 10 builds/hour |
| File size | 100MB max per file |

**Reality check:**
Each dashboard HTML file is ~20-50KB. Even with 1,000 daily visitors loading both files, you'd use: 1,000 × 2 × 50KB = 100MB/day, or ~3GB/month. You'd need ~33,000 daily visitors to hit the 100GB limit.

For a solo founder monitoring their own stack, you'll never come close to any limit.

**Custom domain:** Free. HTTPS via Let's Encrypt: free. GitHub Actions CI/CD: free.

**When to consider alternatives:**
- You need server-side rendering
- You need dynamic routes
- You need a database connection from the frontend (Supabase handles this anyway)
- You want Cloudflare Pages, which has similar free limits

---

### Cloudflare

**Free tier (really free):**

| Feature | Free |
|---------|------|
| DNS management | Unlimited |
| CDN | Unlimited |
| DDoS protection | Always-on (L3/L4) |
| Analytics | 1M requests/month |
| Workers | 100K requests/day |
| Pages | 500 builds/month |
| Zero Trust tunnels | Up to 50 users |

**What this system uses:**
- DNS for custom domain → GitHub Pages (unlimited, free forever)
- DDoS protection on the domain (passive, always-on)
- Analytics to see traffic patterns

**Cloudflare is genuinely free for DNS and basic protection.** No catch here. The $20/month Pro plan adds more analytics, image optimization, and priority support — but not needed for this use case.

---

### UptimeRobot

**Free tier:**

| Feature | Free limit |
|---------|-----------|
| Monitors | 50 |
| Check interval | 5 minutes (minimum) |
| Alert contacts | Unlimited |
| Alert channels | Email, SMS (5/month), Slack, webhooks |
| Log retention | 3 months |

**What this system uses:**
- 1 monitor for n8n health endpoint
- Email alerts on downtime

**When to upgrade:**
- You want 1-minute check intervals (Pro plan: $7/month)
- You need more than 3 months of uptime history
- You need phone call alerts for P0 incidents

---

### Claude API (Optional)

**Pricing (as of 2026):**

| Model | Input | Output |
|-------|-------|--------|
| claude-sonnet-4-20250514 | $3.00/M tokens | $15.00/M tokens |

**Cost per WF-01 classification:**
- Input: ~500 tokens (system prompt + message)
- Output: ~150 tokens (JSON response)
- Cost: (500 × $3 + 150 × $15) / 1,000,000 = **~$0.004 per classification**

**At 100 messages/month:**
100 × $0.004 = **$0.40/month**

**At 500 messages/month:**
500 × $0.004 = **$2.00/month**

**To stay at $0:** Disable the Claude API Classification node in WF-01 and hardcode placeholder classification values. You lose AI tagging but keep the ingestion pipeline working.

**Free credit:**
New Anthropic accounts get $5 in free credits. That covers ~1,250 classifications.

---

## True Cost Model

| Scenario | Monthly cost |
|----------|-------------|
| Solo founder, monitoring own stack | **$0** |
| Solo founder + Claude classification (500 msg/mo) | **~$2** |
| Small team, <1,000 daily users | **$0-5** |
| Growing product, 10K daily API calls to Supabase | **$25** (Supabase Pro) |
| Scale-up, persistent n8n + Supabase Pro | **$32/month** |

---

## What "Free" Actually Means

These aren't free trials with cliffs. They're genuine free tiers that have existed for years:

- **GitHub Pages**: Free since 2008. Monetized via GitHub Pro/Teams for private repos.
- **Cloudflare DNS**: Free since 2009. Revenue comes from enterprise and Workers.
- **Supabase**: Free tier sustained by VC-backed growth strategy. Has pausing for inactivity — mitigate with keep-alive.
- **Render**: Free tier to acquire developers. Paid plans kick in for production workloads.

**The real risk:** All these companies could change their free tier terms. Build your architecture so you can swap any tier in under a day:
- n8n on Render → n8n Cloud, Railway, Fly.io
- Supabase → PlanetScale, Neon, any PostgreSQL host
- GitHub Pages → Cloudflare Pages, Netlify, Vercel

The HTML files are portable. The SQL schema is standard PostgreSQL. The n8n workflows are JSON. Nothing proprietary.

---

## Upgrade Path

When this system outgrows free tiers:

| Service | Next paid tier | Monthly cost |
|---------|---------------|-------------|
| Render | Starter | $7 |
| Supabase | Pro | $25 |
| UptimeRobot | Pro | $7 |
| n8n Cloud | Starter | $20 |
| **Total** | | **$59/month** |

That's still dramatically cheaper than Datadog ($15+/host), Grafana Cloud ($8+), or any enterprise monitoring tool.
