# Customization Guide

This system is designed to be adapted. Here's how to make it yours.

---

## Changing Monitored Services

The semaphore grid in `dashboard/cto-cockpit.html` is driven by the `CONFIG.services` array:

```javascript
const CONFIG = {
  services: [
    {
      id: 'n8n',
      name: 'n8n',
      pingUrl: 'https://YOUR-N8N.onrender.com/healthz',
      description: 'Automation engine',
    },
    // Add more services here
  ],
};
```

**Adding a service:**
```javascript
{
  id: 'stripe',         // unique ID, used to match status data
  name: 'Stripe',       // display name
  pingUrl: null,        // optional direct health check URL
  description: 'Payments',
}
```

**Status data** comes from your `statusEndpoint`. That n8n webhook should return an object keyed by service ID:

```json
{
  "stripe": {
    "status": "green",
    "label": "Operational",
    "detail": "Last payment: 2h ago",
    "time": "5m ago"
  }
}
```

You can build the status aggregator as a simple n8n workflow that:
1. Pings each service's health endpoint
2. Queries Supabase for recent errors
3. Returns the aggregated status object

---

## Adding New n8n Workflows

Follow the WF-01 pattern:

1. **Trigger node** — Webhook (for event-driven) or Schedule (for periodic tasks)
2. **Process data** — Function nodes to transform/filter
3. **Store result** — Supabase node to insert/update
4. **Respond** — Respond to Webhook node with success/error

### Useful patterns

**Scheduled daily summary:**
```
Schedule (9:00 AM) → Fetch Supabase stats → Format message → Send Slack notification
```

**GitHub PR monitoring:**
```
GitHub webhook → Filter PRs → Check age → Alert if open >48h → Supabase incident insert
```

**Cloudflare analytics pull:**
```
Schedule → Cloudflare API → Transform → Supabase upsert → Update status endpoint
```

**Key n8n nodes to know:**
- `HTTP Request` — Call any REST API
- `Supabase` — Read/write your database
- `Function` — Custom JavaScript
- `IF` — Conditional branching
- `Schedule` — Time-based triggers
- `Slack` — Send messages to channels
- `Respond to Webhook` — Return JSON to the caller

---

## Modifying the Dashboard

`dashboard/cto-cockpit.html` is a self-contained HTML file. No build tools.

### Changing the color theme

Find the `:root` CSS block at the top:

```css
:root {
  --bg:        #0a0a0a;   /* Background */
  --bg-card:   #111111;   /* Card background */
  --green:     #00ff88;   /* Operational / accent */
  --yellow:    #ffcc00;   /* Warning / degraded */
  --red:       #ff4444;   /* Critical / down */
  --blue:      #6688ff;   /* Info / secondary */
}
```

Change these values to match your brand. The rest of the CSS uses these variables.

### Adding a new section

1. Add a `<div class="section-header">Your Section</div>` in the HTML
2. Add a container `<div id="your-section"></div>`
3. Add a `loadYourData()` function that fetches and formats data
4. Call it in the `refresh()` function alongside the others
5. Add a `renderYourSection(data)` function that builds the HTML

### Adding charts

Include Chart.js via CDN:
```html
<script src="https://cdn.jsdelivr.net/npm/chart.js@4"></script>
```

Then add a canvas in your section and initialize the chart in your render function. Chart.js works well with the dark theme — use `backgroundColor: 'rgba(0, 255, 136, 0.1)'` and `borderColor: '#00ff88'` to match.

### Modifying the morning sync summary

The `morningSync()` function builds the summary text. Edit the logic to include your own metrics:

```javascript
async function morningSync() {
  // ... existing code ...
  
  // Add your own summary line:
  const metadataCount = await getMetadataCount(); // your Supabase query
  summary += `${metadataCount} new entries this week.`;
}
```

---

## Adding New Supabase Tables

1. Write the `CREATE TABLE` statement following the pattern in `schema/supabase-schema.sql`
2. Add an `updated_at` trigger
3. Enable RLS and add appropriate policies
4. Add indexes on columns you'll query frequently
5. Run in Supabase SQL Editor

**Template:**
```sql
CREATE TABLE IF NOT EXISTS your_table (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- your columns
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE your_table ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Your policy name"
ON your_table FOR SELECT
USING (true); -- adjust conditions as needed

CREATE TRIGGER your_table_updated_at
BEFORE UPDATE ON your_table
FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

---

## Connecting Different Data Sources

### Slack

1. In your Slack workspace, go to **Apps > Manage > Custom Integrations > Incoming Webhooks**
2. Create a webhook for a channel
3. For outgoing data to n8n: go to **Apps > Manage > Custom Integrations > Outgoing Webhooks**
4. Set the trigger word and URL to your n8n WF-01 webhook
5. n8n will receive Slack messages and classify them

### GitHub

1. Go to your repo **Settings > Webhooks > Add webhook**
2. Payload URL: `https://YOUR-N8N.onrender.com/webhook/wf01-ingest`
3. Content type: `application/json`
4. Events: Select the events you want to capture (pushes, PRs, issues)
5. n8n's Extract Content node handles GitHub's payload format

### Any HTTP API (Cloudflare, LinkedIn, etc.)

Add a Schedule trigger in n8n and an HTTP Request node that calls the API's endpoint. Transform the response in a Function node and send it to WF-01's webhook or insert directly into Supabase.

**Example — Cloudflare analytics:**
```javascript
// In a Function node after Cloudflare API call
const stats = $input.item.json.result.totals;
return {
  json: {
    text: `Cloudflare daily: ${stats.requests.all} requests, ${stats.threats.all} threats blocked`,
    source: 'cloudflare',
    user_id: 'system',
  }
};
```

---

## Changing the Narrative Taxonomy

The `narrative_role` and `timeline_group` fields in WF-01 and WF-04 use a custom taxonomy. Change it to match your project:

**In WF-01** (Claude API Classification node), edit the prompt:
```
"narrative_role": "your_role_1|your_role_2|your_role_3"
```

**In WF-04** (Temporal Clustering node), change the date ranges:
```javascript
if (year >= 2020 && year <= 2022) {
  timeline_group = 'early-2020s';
} else if (year >= 2023 && year <= 2024) {
  timeline_group = 'growth-phase';
} else if (year >= 2025) {
  timeline_group = 'current';
}
```

**Update groups in Narrative Arc Detection** to match your new timeline_group values.

---

## Replacing Claude with a Different LLM

The `Claude API Classification` node in WF-01 is a standard HTTP Request. Replace it with any LLM API:

**OpenAI (GPT-4):**
- URL: `https://api.openai.com/v1/chat/completions`
- Body: `{ "model": "gpt-4o", "messages": [...], "max_tokens": 1024 }`
- Auth: Bearer token in `Authorization` header

**Google Gemini:**
- URL: `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent`
- Auth: API key as query parameter

**Local LLM (Ollama):**
- URL: `http://localhost:11434/api/chat`
- No auth needed
- Free, private, no API costs

The `Parse Classification` function node handles the response parsing — update the `content` extraction path to match your chosen API's response format.

---

## Deployment Variants

### Self-hosted n8n (Docker)

If you prefer not to use Render, run n8n locally or on any VPS:

```bash
docker run -d \
  --name n8n \
  -p 5678:5678 \
  -e N8N_BASIC_AUTH_ACTIVE=true \
  -e N8N_BASIC_AUTH_USER=admin \
  -e N8N_BASIC_AUTH_PASSWORD=your-password \
  -v n8n_data:/home/node/.n8n \
  n8nio/n8n:latest
```

### n8n Cloud

Import the workflow JSONs directly into n8n Cloud. The credentials and webhook URLs auto-configure.

### Supabase on Railway or Neon

If Supabase pausing or free tier limits become an issue, the SQL schema is standard PostgreSQL — runs on any Postgres host. Update the connection credentials in n8n.

### Cloudflare Pages instead of GitHub Pages

Cloudflare Pages has identical free limits and faster global CDN. Copy the dashboard files to a Cloudflare Pages project. Update the deploy workflow in `.github/workflows/deploy.yml` to use Cloudflare's GitHub Action.
