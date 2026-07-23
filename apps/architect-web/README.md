# Architect OS · LiNK Foundation

This isolated Next.js application is the first production scaffold for Architect OS and its persistent coordinating intelligence, LiNK.

## Current implementation

- Canonical persistent LiNK visual component
- Dormant, listening, processing, speaking and error states
- Local-time greeting behaviour ending in “sir”
- Three mirrored centre-out gold LED voice bars
- Presence Memory schema and authority precedence
- Workspace membership and row-level security policies
- Authenticated Supabase server and browser clients
- Live Command snapshot loader with Safe Preview fallback
- Email/password sign-in foundation
- Idempotent first-workspace bootstrap action
- Tool receipt and operational event tables
- Isolated GitHub Actions typecheck/build workflow

## Local setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

The approved canonical asset must be placed unchanged at:

```text
public/brand/link-canon.png
```

## Database migration order

1. `supabase/migrations/20260721_presence_memory.sql`
2. `supabase/migrations/20260721_rls_and_bootstrap.sql`

Do not use a Supabase service-role key in the browser application.

## Safety model

When Supabase is absent or no authenticated session exists, the Command screen remains in clearly labelled Safe Preview mode. Live workspace data is protected by PostgreSQL row-level security. Canon writes require owner or administrator authority.

## Current gate

The branch remains non-production until:

- Repository visibility is verified private
- Canonical image binary is committed
- Supabase project values are connected
- Migrations pass against a clean database
- Authentication bootstrap is tested
- CI passes
- LiveKit output replaces the temporary speaking envelope
