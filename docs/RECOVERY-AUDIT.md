# iNKVRS OS — Canonical Recovery Audit

**Date:** 2026-07-19  
**Recovery branch:** `build/canonical-recovery`  
**Connected repository:** `blackzone2114-web/inkvrse-os`

## Executive finding

The connected GitHub repository is **not the application described by the supplied handoff package**.

The connected repository currently contains a small static Vercel founder landing page with vanilla HTML/CSS/JavaScript and serverless API routes. Its `package.json` builds by copying `index.html`, `styles.css`, and `script.js` into `dist/`.

The handoff package describes a different, substantially more advanced application:

- Next.js 16 App Router
- TypeScript strict mode
- Tailwind v4
- Framer Motion
- Supabase Auth, RLS and roughly 30 marketplace tables
- Six profile types
- Signup role pass-through
- User dashboard
- iNKFi wallet ledger
- Completed milestones M1 and M2
- Work living on branch `claude/marketplace-phase-1-0g1546`
- Original repository identified as `khantat2/inkvrs.os`

Building Phase 3 into the currently connected static repository would discard or duplicate completed work and create another fork. That is explicitly the failure pattern this recovery is intended to stop.

## Verified connected-repository state

The current repository has:

- A static founder landing page
- Supabase waitlist API wiring
- Stripe checkout-session API wiring
- Static Vercel output configuration
- No verified Next.js App Router application
- No verified TypeScript application structure
- No verified profile/dashboard implementation
- No verified iNKFi wallet implementation

The latest visible commits include:

1. `Add Stripe checkout API route`
2. `Add Supabase waitlist API route`
3. `Add iNKVRSE launch styles`
4. `Add waitlist schema`
5. `Add founder landing page`

## Infrastructure mismatch

### Supabase

The handoff's application uses project:

- `vcjjureevixdejnsxvwv`

The currently connected Supabase account exposes:

- Project name: `iNKVRS`
- Project ref: `pnghrzsaavarxhxsgdxq`
- Status observed: `INACTIVE`

These are different projects. No schema or environment migration should be performed until the intended production project is identified and its existing data/schema is inspected.

### Vercel

The handoff identifies the intended project as:

- `inkvrs-os`
- Domain: `inkvrs-os.vercel.app`
- Production branch: `claude/marketplace-phase-1-0g1546`

It also warns that similarly named Vercel projects point to different repositories. The connected Vercel team must be inspected before changing project settings or deployments.

## Canonical recovery decision

Until the original Next.js repository is connected, this repository will **not** be treated as the production source of truth.

This recovery branch exists to:

1. Preserve the audit.
2. Prevent accidental changes to `main`.
3. Provide a staging point only if the original repository cannot be recovered.
4. Avoid schema, billing, deployment, or destructive infrastructure changes.

## Required recovery sequence

### Gate 1 — Recover the actual application repository

Connect or grant access to one of the following, beginning with the exact handoff source:

1. `khantat2/inkvrs.os`
2. `khantat2/founderspage-inkvrs`
3. `khantat2/-nextpanel-app`

The first repository is the priority because the handoff states that M1 and M2 were built there.

### Gate 2 — Verify code against the handoff

The recovered repository must contain or materially match:

- `app/` App Router structure
- Supabase client/server helpers
- Role-aware `/signup`
- `/dashboard`
- Six role profile routes/pages
- `HUDCard` and `BottomNav`
- Theme tokens in `globals.css`
- Wallet transaction reads and dashboard balance

### Gate 3 — Reconcile Supabase

Before any database write:

1. Inspect both known project refs.
2. Identify which project contains `monolith_brain`, `profiles`, `artist_profiles`, `wallet_transactions`, and the marketplace tables.
3. Export/schema-snapshot the correct project.
4. Confirm RLS policies and migration history.
5. Present any new schema or money-flow change for explicit sign-off before implementation.

### Gate 4 — Reconcile Vercel

Verify the deployment project's repository link, production branch, environment variables, build logs, and live URL. Do not repair a similarly named but unrelated project.

### Gate 5 — Resume Phase 1 at M3

Only after Gates 1–4 pass:

- Build artist iNKSTORE against `shop_products`.
- Build supplier iNKSUPPLY against `supplier_products` and `supply_feed_posts`.
- Keep seller proceeds at 100%.
- Apply buyer-side fee rules only after the worked payment examples are reviewed and approved.

## Immediate status

- Protected recovery branch created: **yes**
- `main` modified: **no**
- Database modified: **no**
- Vercel modified: **no**
- Stripe modified: **no**
- Safe to continue auditing: **yes**
- Safe to start M3 implementation in the connected repository: **no**
