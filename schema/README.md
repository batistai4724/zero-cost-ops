# Schema

This directory contains the database schema and API specification for zero-cost-ops.

---

## Files

### `supabase-schema.sql`

Complete PostgreSQL schema for Supabase. Run this in Supabase Dashboard > SQL Editor to create all tables, indexes, RLS policies, and triggers.

**5 tables:**
- `metadata` — Core content store (ingested and classified entries)
- `users` — User profiles (synced from Supabase Auth)
- `diagnostics` — Diagnostic session results
- `bookings` — Appointment records (Calendly integration)
- `payments` — Payment records (Stripe integration)

**How to apply:**
```
Supabase Dashboard > SQL Editor > New Query > paste file > Run
```
Or with Supabase CLI:
```bash
supabase db push
```

### `openapi.yaml`

OpenAPI 3.0 specification for the REST API. Import into Postman, Insomnia, or any OpenAPI-compatible tool to explore the endpoints.

**Key endpoints:**
- `POST /auth/oauth/start` — OAuth initiation
- `POST /api/diagnostic/analyze` — Content classification
- `GET /api/user/profile` — User profile
- `POST /api/webhooks/calendly` — Calendly event handler
- `POST /api/webhooks/stripe` — Stripe payment handler

**How to use:**
```bash
# Preview with Swagger UI (requires npx)
npx @redocly/cli preview-docs schema/openapi.yaml

# Or import into Postman:
# File > Import > select openapi.yaml
```

---

## Customization

**Renaming tables:** If your project uses different entity names, rename the tables in `supabase-schema.sql` and update the n8n workflow `tableId` parameters accordingly.

**Adding columns:** Add `ALTER TABLE metadata ADD COLUMN ...` statements to the schema file. Then add the new field to the Supabase Insert node in WF-01.

**Changing timeline groups:** Edit the `timeline_group` check constraint (if you add one) and update the Temporal Clustering function in WF-04.

**Different OAuth providers:** Supabase Auth supports GitHub, Google, Twitter, Discord, and more. Enable them in Dashboard > Authentication > Providers.
