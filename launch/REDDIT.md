# Reddit Posts

---

## r/n8n

**Title:** Built a CTO monitoring cockpit with n8n + Supabase + GitHub Pages — all free, sharing the workflows

---

Been using n8n for about a year and finally put together something worth sharing. I built a production monitoring dashboard for my solo SaaS that runs entirely on n8n (self-hosted on Render) + Supabase + GitHub Pages. Total monthly cost: $0.

**The two workflows:**

**WF-01: Ingestion Pipeline**
Webhook → Extract Content → Filter noise → Claude API classification → Parse JSON → Supabase insert → Trigger cross-linking

Takes any content (Slack messages, GitHub events, manual notes) and automatically extracts tags, entities, a summary, and a narrative role. The Claude classification prompt is the interesting bit — it's designed to extract structured metadata, not just summarize. Output is clean JSON that goes straight into Postgres.

**WF-04: Timeline Engine**
Manual trigger → Fetch all entries → Temporal clustering → Narrative arc detection → Batch update

Scans the entire metadata table, parses `date_estimated` fields, and assigns each entry to a time period. Then does a narrative arc analysis across periods. Useful for understanding the shape of your data over time.

**Setup:**
- n8n runs on Render free tier (Docker image `n8nio/n8n:latest`)
- UptimeRobot pings `/healthz` every 5 minutes to prevent sleep
- Supabase service role key in Render env vars
- Anthropic API key in n8n credentials

**Repo:** https://github.com/ProyectoAna/zero-cost-ops

The workflow JSONs are in `/workflows/` — importable directly into n8n. Would love feedback on the architecture, especially the temporal clustering logic in WF-04. Anyone else doing timeline analysis on their n8n data?

---

## r/selfhosted

**Title:** Self-hosted CTO dashboard on Render free tier + Supabase + GitHub Pages — full setup guide included

---

I wanted a monitoring dashboard for my small SaaS. I didn't want to pay for Datadog or run my own Grafana instance. Here's what I built instead.

**Architecture:**

```
Data sources (Slack/GitHub/Cloudflare) 
  → n8n webhooks (Docker on Render free tier)
  → Supabase PostgreSQL (free tier, 500MB)
  → GitHub Pages (static dashboard)
  → Phone (PWA)
```

**n8n on Render specifics:**
- Image: `n8nio/n8n:latest`
- Free tier: 512MB RAM, 0.1 CPU, 750 hours/month
- Critical: add UptimeRobot to ping `/healthz` every 5 minutes or it sleeps
- Service role key stored as Render env var — never in code
- SQLite for workflow storage (fine for single-user; persistence across deploys is a known limitation of Render free)

**Supabase setup:**
- 5 tables: metadata, users, diagnostics, bookings, payments
- RLS on all tables
- Anon key safe to embed in frontend because RLS limits access
- Service role key only in n8n (server-side)
- Free tier: 500MB storage, 50K API calls/month — more than enough for low-traffic personal use

**Dashboard:**
- Single HTML file — no Node, no build tools
- PWA with service worker for offline use
- Polls Supabase REST API directly (anon key, RLS-protected)
- GitHub Pages deploys on every push via 10-line GitHub Actions workflow

**Full repo with deployment guide:** https://github.com/ProyectoAna/zero-cost-ops

The `/docs/DEPLOYMENT.md` has the complete step-by-step. You can go from zero to working dashboard in about 20 minutes.

What would you do differently? I considered Fly.io for n8n but Render's UI is simpler for one-person setups. Also looked at PocketBase as an alternative to Supabase for simpler auth — might revisit that.

---

## r/indiehackers

**Title:** I replaced $80/month of monitoring tools with $0/month of free tiers — here's the system

---

Six months ago I was paying:
- Sentry: $26/month
- n8n Cloud: $20/month
- Datadog: Free, but I knew the cliff was coming
- Various status page tools

I was bootstrapped, building alone, and the monitoring bill was becoming annoying relative to my MRR. So I cut it all and built my own system on free tiers. Here's what that looks like now.

**The stack:**

| Before | After | Savings |
|--------|-------|---------|
| n8n Cloud ($20) | n8n on Render free tier | $20/mo |
| Sentry ($26) | Supabase error logging + n8n alerts | $26/mo |
| Status page ($10+) | GitHub Pages PWA | $10/mo |
| ~~Datadog~~ | Not needed | $0/mo |

**What the system actually does:**

Every morning I open a PWA on my phone. It shows traffic-light status for all my services (n8n, Supabase, GitHub, Cloudflare, Slack), a log of any open incidents, and a to-do list of next actions. I tap Sync, get a one-line summary, and move on.

Behind the dashboard, n8n workflows auto-ingest content from my tools, classify it with Claude AI, and store it in Supabase. Over time I've built a searchable record of everything that's happened in the system — incidents, decisions, notable events — with zero manual effort.

**The honest tradeoffs:**
- Render free tier sleeps (fixed with UptimeRobot)
- No real-time alerting (I get email from UptimeRobot for downtime)
- Supabase pauses after 7 days of zero activity (UptimeRobot keep-alive handles this too)
- Claude API costs ~$0.40/month (worth it)

**What I actually saved:** ~$55/month, or $660/year. Not a lot in absolute terms, but for a bootstrapped solo founder at early MRR, that's meaningful.

**Everything is open source:** https://github.com/ProyectoAna/zero-cost-ops

Fork it, follow the `/docs/DEPLOYMENT.md`, have it running in 20-30 minutes.

Anyone else gone down the "build your own monitoring" path? Curious what corners I'm cutting that I shouldn't be.
