# Architecture

zero-cost-ops is a three-tier system: data sources feed into an automation layer, which writes to a database, which serves a static dashboard. Every tier runs on a free service.

---

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        DATA SOURCES                             │
│                                                                  │
│  ┌────────┐ ┌────────┐ ┌───────────┐ ┌──────────┐ ┌────────┐  │
│  │ Slack  │ │GitHub  │ │Cloudflare │ │ LinkedIn │ │  Meta  │  │
│  │webhooks│ │ events │ │  alerts   │ │  posts   │ │  ads   │  │
│  └────┬───┘ └───┬────┘ └─────┬─────┘ └────┬─────┘ └───┬────┘  │
│       └─────────┴────────────┴────────────┴───────────┘       │
│                           HTTP POST                             │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                 AUTOMATION LAYER — n8n on Render                │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ WF-01: Ingestion Pipeline                               │   │
│  │   Webhook → Extract → Filter → Claude AI → Parse        │   │
│  │   → Supabase Insert → Trigger Cross-link                │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ WF-04: Timeline Engine                                  │   │
│  │   Webhook → Fetch All → Temporal Cluster                │   │
│  │   → Narrative Arc → Batch Update                        │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ WF-00: System Status (optional)                         │   │
│  │   Cron → Check services → Update status table           │   │
│  └─────────────────────────────────────────────────────────┘   │
└───────────────────────────┬─────────────────────────────────────┘
                            │  Supabase REST API
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                 DATABASE — Supabase (free tier)                  │
│                                                                  │
│  ┌───────────┐  ┌───────────┐  ┌────────────┐  ┌───────────┐  │
│  │ metadata  │  │   users   │  │diagnostics │  │ bookings  │  │
│  │ (core)    │  │  (auth)   │  │ (sessions) │  │ (sched.)  │  │
│  └───────────┘  └───────────┘  └────────────┘  └───────────┘  │
│                                                                  │
│  PostgreSQL 15 · Row-Level Security · Real-time · 5 tables      │
└───────────────────────────┬─────────────────────────────────────┘
                            │  fetch() — anon key
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│              PRESENTATION — GitHub Pages (free)                  │
│                                                                  │
│  ┌─────────────────────┐  ┌──────────────────────────────────┐ │
│  │  cto-cockpit.html   │  │  system-dashboard.html           │ │
│  │                     │  │                                  │ │
│  │  - Semaphore grid   │  │  - Live metadata entries         │ │
│  │  - Incident log     │  │  - Cross-link stats              │ │
│  │  - Action list      │  │  - Source distribution           │ │
│  │  - Morning sync     │  │  - Latency monitor               │ │
│  │  - PWA installable  │  │  - Auto-refresh 60s              │ │
│  └──────────┬──────────┘  └──────────────────────────────────┘ │
└─────────────┼───────────────────────────────────────────────────┘
              │  Install to home screen
              ▼
        Your Phone
        (PWA, offline-capable)
```

---

## Component Details

### Data Sources

The system is source-agnostic. Anything that can send an HTTP POST can feed data in.

| Source | Integration method |
|--------|-------------------|
| Slack | Incoming webhooks → POST to n8n |
| GitHub | Repository webhooks → POST to n8n |
| Cloudflare | Workers or alerts → POST to n8n |
| Manual | Direct POST from curl/Postman |
| Any service | Any HTTP webhook → POST to n8n |

The payload format is flexible — the Extract Content node in WF-01 normalizes different shapes.

### n8n on Render (Automation Layer)

n8n is the workflow engine. It runs in a Docker container on Render's free tier.

**Key properties:**
- Stateless processing — each workflow run is independent
- Webhook-triggered (no polling)
- Credentials stored in n8n's encrypted store (not in code)
- n8n's execution history provides a built-in audit trail

**Free tier constraint:** Render free instances sleep after 15 minutes of inactivity. A UptimeRobot ping every 5 minutes keeps it warm at no cost.

### Supabase (Database Layer)

Supabase provides PostgreSQL with a built-in REST API (PostgREST), authentication, and real-time subscriptions.

**What's used:**
- **PostgreSQL**: Primary data store (5 tables)
- **PostgREST**: Auto-generated REST API — no backend code needed
- **Auth**: OAuth + JWT management
- **Row-Level Security**: Access control at the database level

**What's not used (keeping it free):**
- Edge Functions (paid)
- Storage (not needed for text metadata)
- Real-time subscriptions (polling is sufficient at this scale)

**Free tier limits:** 500MB storage, 50K API calls/month, 2 projects. Current usage for typical solo founder: ~12K API calls/month, ~50MB.

### GitHub Pages (Presentation Layer)

The dashboard is a static site with no server requirements.

**Architecture:**
- Single HTML files with embedded CSS and JS
- Fetch API calls directly to Supabase REST endpoint
- PWA manifest + service worker for installability
- GitHub Actions deploys on every push to `main`

**Why not a SPA framework?** No build tools, no Node.js, no npm. Open the HTML file in a browser and it works. Fork the repo, push a change, it deploys. That's the whole deployment pipeline.

---

## CTO Cockpit — Data Flow Detail

```
Phone opens cto-cockpit.html (cached by service worker)
         │
         ├─ Clock updates every second (JS Date)
         │
         ├─ On load and every 60s:
         │    ├─ loadStatuses() → n8n status endpoint → render semaphores
         │    ├─ loadIncidents() → Supabase REST → render incident log
         │    └─ loadActions() → Supabase REST → render action list
         │
         └─ Morning Sync button:
              ├─ Trigger all three loads
              └─ Generate text summary from state
```

### Demo Mode

When `statusEndpoint`, `supabaseUrl`, and `supabaseKey` are all `null`, the dashboard renders demo data. This lets you see the UI immediately without any backend setup. Configure the `CONFIG` object at the top of `cto-cockpit.html` to connect to real endpoints.

---

## Monitoring Strategy

### Semaphores

Each service has a three-state status:

| Color | Meaning |
|-------|---------|
| 🟢 Green | Operational — no action needed |
| 🟡 Yellow | Degraded — monitor, may need intervention |
| 🔴 Red | Down or critical — immediate action required |

Status values are fetched from your n8n status endpoint or Supabase. The endpoint can check upstream services, query Supabase for recent errors, or ping health check URLs.

### Incident Log

Open incidents pulled from Supabase (or demo data). Priority levels:

| Level | Threshold |
|-------|-----------|
| P0 | Service down or data loss risk |
| P1 | Degraded performance, SLA at risk |
| P2 | Minor issue, no immediate impact |

### Actions

A simple to-do list integrated into the cockpit. Actions can be created in Supabase directly or via an n8n workflow that auto-creates actions when incidents are detected.

### Morning Sync

Pressing SYNC triggers a fresh data load and generates a one-line text summary: how many services are green/yellow/red, how many open incidents, how many pending actions. Designed to take under 60 seconds to process each morning.

---

## Security Architecture

```
Public internet
     │
     │ HTTPS only (Cloudflare + GitHub Pages)
     ▼
Dashboard (GitHub Pages)
     │
     │ Supabase anon key (read-only, RLS-enforced)
     ▼
Supabase REST API
     │
     │ Row-Level Security policies
     ▼
PostgreSQL (restricted by RLS)

n8n webhooks (separate path)
     │
     │ Supabase service role key (write access)
     │ Stored in Render environment variables
     ▼
PostgreSQL (full access for automation)
```

**Key security properties:**
- Anon key is safe to embed in frontend (read-only, RLS blocks unauthorized access)
- Service role key never touches the frontend — lives only in Render env vars
- No secrets in code or git history
- All transport via HTTPS

---

## Cost Analysis

| Tier | Service | Free limit | Current usage |
|------|---------|------------|---------------|
| Automation | Render | 750h/month | ~730h (with keep-alive) |
| Automation | n8n | Unlimited on self-hosted | All workflows |
| Database | Supabase | 500MB / 50K calls | ~50MB / ~12K calls |
| Frontend | GitHub Pages | 100GB bandwidth | <1GB |
| DNS/CDN | Cloudflare | Unlimited | All traffic |
| Monitoring | UptimeRobot | 50 monitors | 1 monitor |
| **Total** | | | **$0/month** |
