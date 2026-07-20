# Architect OS

Architect OS is the internal operating system layer for PARA triage, realtime Construct workflows, vector memory, Wargame pre-mortems, Lore canon, Loop synthesis, family consent gating, voice history, and knowledge-graph connections.

## Canonical backend

The production baseline migration is stored at:

`supabase/migrations/20260720_001_architect_os_schema_v1_0_canon.sql`

The engineering audit is stored at:

`docs/ARCHITECT_OS_SCHEMA_AUDIT.md`

## Supabase project

- Project name: `architect-os`
- Project ref: `gmsaisgpslggsabbiiwd`
- Region: Sydney (`ap-southeast-2`)

## Deployment

1. Open the `architect-os` project in Supabase.
2. Open SQL Editor and create a new query.
3. Paste the full canonical migration file.
4. Run it once and confirm there are no errors.
5. Run it a second time as the idempotency smoke test.
6. Create two test users and verify RLS isolation.
7. Test realtime on `para_items`.
8. Test vector search with 1536-dimensional embeddings.

## Environment variables

```env
NEXT_PUBLIC_SUPABASE_URL=https://gmsaisgpslggsabbiiwd.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
SUPABASE_SERVICE_ROLE_KEY=server-side-only
```

Never expose `SUPABASE_SERVICE_ROLE_KEY` through a `NEXT_PUBLIC_` variable or commit any secrets to GitHub.

## Current scope

This baseline contains:

- PARA items
- Memory embeddings
- Wargame evaluations
- Lore universes and entries
- Family members and commitments
- Loop cycles
- Voice sessions
- Knowledge-graph connections
- RLS-safe vector RPCs
- Realtime publication setup

It is currently a single-owner architecture. Teams, organisations, delegated access, audit logs, queues, billing, retention, and shared workspaces should be added through numbered migrations.
