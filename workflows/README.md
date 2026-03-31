# Workflows

Two n8n workflows are included. Together they handle auto-ingestion, AI classification, and timeline organization of your system's metadata.

---

## Overview

| Workflow | Trigger | What it does |
|----------|---------|--------------|
| **WF-01** — Ingestion Pipeline | Webhook (POST) | Receives content → filters noise → classifies with Claude → stores in Supabase → triggers cross-linking |
| **WF-04** — Timeline Engine | Webhook or manual | Scans all entries → clusters by time period → detects narrative arc → bulk-updates `timeline_group` field |

---

## WF-01: Ingestion Pipeline

**File:** `WF-01-ingestion-pipeline.json`

### What it does

Receives any content via webhook and processes it into a structured metadata entry.

```
Webhook → Extract Content → Filter Messages → Claude Classify → Parse → Supabase Insert → Trigger WF-02 → Respond
```

### Node breakdown

1. **Webhook Trigger** — Listens on `POST /webhook/wf01-ingest`. Accepts JSON with `text`, `source`, `user_id`, `timestamp`, and optional `metadata`.

2. **Extract Content** — Normalizes the payload. Extracts `message_text`, `source`, `user_id`, and `timestamp` regardless of how the sender structured the POST body.

3. **Filter Messages** — Drops messages shorter than 10 characters and slash commands. Prevents noise from getting classified.

4. **Claude API Classification** — Sends the message to `claude-sonnet-4-20250514`. The prompt extracts:
   - `tags` (3–5 keywords)
   - `entities` (people, companies, concepts)
   - `summary` (1–2 sentences)
   - `narrative_role` (symbol|system|pilot|origin|exploration|setup|conflict|realisation|integration)
   - `date_estimated` (YYYY-MM-DD or YYYY)
   - `timeline_group` (1974-1990|2019-2023|2024-2026)

5. **Parse Classification** — Extracts JSON from Claude's response. Handles markdown code blocks gracefully. Generates a unique `file_name` (`auto_{source}_{timestamp}`).

6. **Supabase Insert** — Inserts the full classified entry into the `metadata` table.

7. **Trigger WF-02** — POSTs to the cross-linking workflow endpoint (if you have one). Remove or modify this node if you don't use WF-02.

8. **Respond Success** — Returns `{ "status": "success", "file_name": "..." }` to the original caller.

### Usage

Send a POST request to your n8n instance:

```bash
curl -X POST https://YOUR-N8N-INSTANCE.onrender.com/webhook/wf01-ingest \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Deployed new RLS policies to Supabase. All security checks passing.",
    "source": "github",
    "user_id": "your-user-id"
  }'
```

### Customization

- **Change the prompt**: Edit the `messages` body parameter in the Claude API Classification node to extract different fields.
- **Add more fields**: Add new columns to the Supabase Insert node's mapping after adding them to the `metadata` table.
- **Different LLM**: Replace the HTTP Request node with any other LLM API — the prompt structure works with GPT-4, Gemini, etc.
- **Different sources**: The `source` field is free-text. Use it to track where content came from (slack, github, manual, twitter, etc.).

---

## WF-04: Timeline Engine

**File:** `WF-04-timeline-engine.json`

### What it does

Scans all entries in your `metadata` table and assigns them to temporal clusters based on `date_estimated`.

```
Webhook → Fetch All Entries → Temporal Clustering → Narrative Arc Detection → Split in Batches → Extract Entry → Update Timeline Group → Respond
```

### Node breakdown

1. **Manual Trigger** — Webhook on `POST /webhook/wf04-timeline`. Trigger manually or on a cron schedule (weekly recommended).

2. **Fetch All Entries** — Retrieves all rows from the `metadata` table via Supabase.

3. **Temporal Clustering** — For each entry, parses `date_estimated` and assigns a `timeline_group`:
   - `1974-1990` — Origin/early period
   - `2019-2023` — Exploration period
   - `2024-2026` — Current/integration period

4. **Narrative Arc Detection** — Groups entries by timeline period and maps the dominant narrative role for each. Returns an analysis summary.

5. **Split in Batches** — Processes entries one at a time to avoid Supabase rate limits.

6. **Extract Entry** — Pulls the current entry from the batch for processing.

7. **Update Timeline Group** — Updates the `timeline_group` field in Supabase for the current entry.

8. **Respond Summary** — Returns a summary with total entries updated and the narrative arc analysis.

### Usage

```bash
curl -X POST https://YOUR-N8N-INSTANCE.onrender.com/webhook/wf04-timeline
```

### Customization

- **Change time periods**: Edit the date ranges in the Temporal Clustering function node.
- **Add new periods**: Add keys to the `groups` object and the corresponding year range checks.
- **Scheduled runs**: Add a Schedule Trigger node to run weekly automatically.
- **Different classification**: The `narrative_role` values are custom — change them to match your project's taxonomy.

---

## How to Import

1. In your n8n instance, go to **Workflows > Import from File**
2. Select `WF-01-ingestion-pipeline.json`
3. Update credentials:
   - **Supabase**: Go to the Supabase Insert node, click "Create New Credential", enter your project URL and service role key
   - **Anthropic**: The Claude API node uses `predefinedCredentialType: anthropicApi` — add your API key in n8n Settings > Credentials
4. Update the Trigger WF-02 node URL to point to your n8n instance (or delete it if unused)
5. **Activate** the workflow
6. Repeat for WF-04

---

## Environment Variables for n8n on Render

```bash
# Required
SUPABASE_URL=https://YOUR-PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Optional — set in n8n credentials manager instead
ANTHROPIC_API_KEY=your-anthropic-key

# n8n configuration
N8N_BASIC_AUTH_ACTIVE=true
N8N_BASIC_AUTH_USER=admin
N8N_BASIC_AUTH_PASSWORD=your-secure-password
N8N_HOST=0.0.0.0
N8N_PORT=5678
WEBHOOK_URL=https://YOUR-N8N-INSTANCE.onrender.com
```

---

## Troubleshooting

**Workflow not triggering**
- Check the webhook URL — must include `https://` and your exact Render domain
- Verify the workflow is **active** (toggle in top-right of workflow editor)
- Check Executions tab for error details

**Claude API returning non-JSON**
- The Parse Classification node handles markdown code blocks. If Claude returns something unexpected, add a `console.log(content)` to the function to see raw output.
- Claude occasionally adds explanatory text — the JSON extraction handles `\`\`\`json` wrappers.

**Supabase insert failing**
- Verify your service role key (not anon key) is in the Supabase credentials
- Check that RLS policies allow authenticated inserts on the `metadata` table
- Ensure all required columns exist — run `schema/supabase-schema.sql` first

**n8n sleeping on Render free tier**
- Free tier instances sleep after 15 minutes of inactivity
- Add a UptimeRobot monitor to ping `https://YOUR-N8N.onrender.com/healthz` every 5 minutes
- This keeps the instance warm at no cost
