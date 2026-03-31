# Twitter/X Thread and LinkedIn Post

---

## Twitter/X Thread (7-10 tweets)

---

**Tweet 1 — Hook**

I monitor 6 services for $0/month using free tiers.

Not a hack. Not a trick. A real production system I've been running for 6 months.

Here's exactly how it works 🧵

---

**Tweet 2 — The problem**

I was paying ~$80/month for monitoring tools.

Sentry. n8n Cloud. A status page service.

As a solo founder, bootstrapped, that math starts to sting.

So I cut it all and built my own system instead.

---

**Tweet 3 — The system**

The stack:

- n8n on Render free tier → automation engine
- Supabase → PostgreSQL database  
- GitHub Pages → dashboard hosting
- Cloudflare → DNS + DDoS protection
- UptimeRobot → external health checks

Total: $0/month

---

**Tweet 4 — The dashboard**

Every morning I open a PWA on my phone.

Traffic light semaphores. Incident log. Next actions.

One tap: Morning Sync.

One line of text: "All 6 services operational. 0 incidents. 3 actions pending."

Done. 60 seconds.

---

**Tweet 5 — The automation**

Behind the dashboard, n8n automatically:

1. Receives content from Slack, GitHub, manual notes
2. Sends to Claude AI for classification
3. Extracts tags, entities, narrative role, timeline
4. Stores structured metadata in Supabase
5. Cross-links related entries

Every notable event in my stack is automatically captured and searchable.

---

**Tweet 6 — The architecture**

```
Slack/GitHub/Cloudflare
       ↓ webhooks
   n8n (Render free)
       ↓ classified data
  Supabase (free tier)
       ↓ REST API
GitHub Pages (free)
       ↓ PWA
   Your phone
```

Three services. Zero servers to manage. Zero monthly cost.

---

**Tweet 7 — The honest tradeoffs**

What "free" actually means:

- Render free tier sleeps after 15min → UptimeRobot keeps it warm
- Supabase pauses after 7 days inactivity → same keep-alive fixes it
- Claude API: ~$0.40/month at my volume → worth it, but optional

Nothing is free if you value your time. This costs ~2 hours of initial setup.

---

**Tweet 8 — Open source**

I open-sourced the whole thing.

- The PWA dashboard (single HTML file, no build tools)
- Both n8n workflows (importable JSON)
- The Supabase schema (run and go)
- Step-by-step deployment guide

Fork → deploy in 30 minutes.

↓ github.com/ProyectoAna/zero-cost-ops

---

**Tweet 9 — CTA**

If you're a solo founder paying for monitoring tools you barely use:

1. Fork the repo
2. Follow the deployment guide
3. Cancel the subscriptions
4. Report back

Would love to know what you'd add or change.

---

**Tweet 10 — About me (optional closer)**

I'm Ana — solo founder building NEYEN, a digital wellbeing platform, in Valencia, Spain.

Everything I build either becomes the product or becomes open source.

Follow if you're interested in building things that work without burning cash.

---

---

## LinkedIn Post

**How I monitor 6 services for $0/month as a solo founder**

I run a digital product company alone. No team, no DevOps budget, no $80/month monitoring tools.

For a while I assumed I had to either pay up or fly blind. Then I spent two weekends building my own solution. Six months later, it's my favorite tool I've made for myself.

Here's what it does:

**A CTO cockpit PWA on my phone.** Every morning I open it, tap Sync, and get a one-line status summary for my entire stack in under 60 seconds. Traffic light semaphores for each service. Incident log. Next actions. The whole thing is a single HTML file hosted on GitHub Pages.

**An auto-ingestion pipeline.** n8n workflows receive content from Slack, GitHub, and other tools via webhooks, send it to Claude AI for classification, and store structured metadata in Supabase. Over time I've built a searchable record of every meaningful event in my system — incidents, decisions, deployments — with zero manual effort.

**The stack:**
- n8n on Render free tier — automation engine
- Supabase — PostgreSQL database and REST API  
- GitHub Pages — dashboard hosting
- Cloudflare — DNS and DDoS protection
- UptimeRobot — external uptime monitoring

Total monthly cost: $0. Claude AI classification costs me about $0.40/month at my volume.

I open-sourced everything:

📌 github.com/ProyectoAna/zero-cost-ops

The repo includes the dashboard HTML, both n8n workflow JSONs (importable), the Supabase SQL schema, and a deployment guide that gets you running in under 30 minutes.

The real lesson isn't about saving money (though saving ~$55/month is nice). It's about knowing your stack well enough to build the monitoring you actually need, rather than paying for something generic that shows you metrics you don't care about.

If you're building alone and want CTO-grade visibility without the subscription bill, fork it.

Happy to answer questions about any part of the architecture.

#indiehacker #buildinpublic #n8n #supabase #opensource #solofounder
