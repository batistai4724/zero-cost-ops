# Indie Hackers Post

**Title:** I built a free CTO dashboard that monitors my entire stack from my phone

---

I'm a solo founder. I built a digital wellbeing platform called NEYEN on top of Supabase, n8n, GitHub, and Cloudflare. At some point I realized I had six services to monitor and zero visibility into any of them unless something broke loudly enough that users complained.

The standard answer is Datadog, or Grafana Cloud, or Sentry, or some combination. Each starts free and then charges you more than you want to pay once you're actually getting value from it. I've been bootstrapped since day one. I'm not paying $40/month to know whether my database is up.

So I built my own. Took about two weekends. Now it's open source.

---

## What it does

It's a CTO cockpit — a dashboard that gives me an at-a-glance view of everything I care about:

- **Traffic light semaphores** for each service (n8n, Supabase, GitHub, Cloudflare, Slack, UptimeRobot)
- **Incident log** — open issues, severity, timestamps
- **Next actions** — a to-do list embedded in the dashboard so I'm not context-switching to Notion to figure out what to do about an incident
- **Morning sync button** — one tap to reload everything and get a one-line summary: "All 6 services operational. 0 incidents. 3 actions pending."

It's a PWA. I installed it on my phone home screen. Every morning I open it, tap Sync, read the summary, and decide what needs attention. Takes 60 seconds.

---

## The stack and what it costs

| Service | Role | Cost |
|---------|------|------|
| n8n on Render | Automation workflows | $0 |
| Supabase | PostgreSQL database | $0 |
| GitHub Pages | Dashboard hosting | $0 |
| Cloudflare | DNS + protection | $0 |
| UptimeRobot | External health checks | $0 |
| Claude API | AI content classification | ~$2/month (optional) |

Total: $0. Or $2 if you want AI-powered tagging.

---

## The automation part

The interesting piece isn't just the dashboard — it's the data pipeline behind it.

There are two n8n workflows:

**WF-01: Ingestion Pipeline**
Receives content via webhook from Slack, GitHub, wherever → filters noise → sends to Claude for classification (extracts tags, summary, narrative role, timeline) → stores in Supabase → triggers cross-linking.

This means every time I post something meaningful in Slack, or a GitHub PR merges, or I manually drop in a note — it automatically gets classified and stored in a structured metadata layer.

**WF-04: Timeline Engine**
Periodically scans all entries, clusters them by time period, and detects narrative arc patterns. Useful if you want to tell a coherent story about your project's evolution. Maybe overkill for everyone — but I find it useful.

---

## What I'm actually open-sourcing

The full repo is at: https://github.com/ProyectoAna/zero-cost-ops

It includes:
- `dashboard/cto-cockpit.html` — the PWA dashboard (self-contained, no build tools)
- `dashboard/system-dashboard.html` — system metadata viewer
- `workflows/WF-01-ingestion-pipeline.json` — n8n workflow, importable
- `workflows/WF-04-timeline-engine.json` — n8n workflow, importable
- `schema/supabase-schema.sql` — PostgreSQL schema, run and go
- `docs/DEPLOYMENT.md` — step-by-step setup guide (~20 minutes)
- `docs/COST-BREAKDOWN.md` — honest analysis of free tier limits

Someone should be able to fork, follow the deployment guide, and have a working dashboard in under 30 minutes.

---

## What I learned building this

A few things that surprised me:

**Render's free tier is workable.** Everyone says free instances sleep — they do. UptimeRobot pings the health endpoint every 5 minutes and it stays warm. n8n on Render is a legitimate production setup for low-throughput workloads.

**Supabase's anon key is safe to embed.** Row-Level Security means the anon key only accesses what you explicitly allow it to. I can put the anon key in a public GitHub Pages file and it only reads what I want it to read. This simplifies the architecture significantly — no need for a backend proxy.

**Single HTML files have a place.** I initially assumed I'd need a React app for this. I don't. One HTML file with embedded CSS and JS, hosted on GitHub Pages, auto-deployed with a 10-line GitHub Actions workflow. Zero build tools. Works offline with a service worker. Opens instantly.

**AI classification is genuinely useful at small scale.** Running ~100-200 messages through Claude per month costs me about $0.40. The structured metadata (tags, entities, narrative role) makes the data searchable and meaningful instead of a pile of raw text.

---

## Questions I'd like feedback on

1. Is there an audience for this as a tool other founders adopt, or is it too specific to how I work?
2. What would make you actually use this vs. a managed monitoring service?
3. Are there obvious integrations I'm missing (Stripe webhooks, Cal.com, etc.)?

The code is all there. Feel free to take it apart.

— Ana
