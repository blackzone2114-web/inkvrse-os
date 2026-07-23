# Architect OS account consolidation

## Objective

Move Architect OS onto infrastructure accounts the owner can directly access and operate, without losing any work from the current feature branch.

## Current verified source

- Product: Architect OS
- Persistent intelligence: LiNK
- Repository: `blackzone2114-web/inkvrse-os`
- Active branch: `feature/link-architect-os-foundation`
- Application root: `apps/architect-web`
- Current Vercel project visible to the GPT connector: `architect-os-preview`
- Current Vercel team visible to the GPT connector: `black-zone`

## Owner-controlled target accounts reported by the user

### Vercel

- Team: `iNKVERSE app - FTW`
- Team/account slug seen by the user: `inkevo-7323s-projects`
- Existing projects include `inkvrse-os`, `inkvrs-os`, `arcads-agent`, `founderspage-inkvrs`, `nextpanel-final`, and `-nextpanel-app`.

Target: create a new dedicated Vercel project named `architect-os` or `architect-os-preview` under the owner-controlled team rather than reusing the donor `inkvrse-os` deployment.

### Supabase

- Organization: `blackzone2114-web's Org`
- Existing project ref: `vcjjureevixdejnsxvwv`
- Existing project purpose: iNKVERSE marketplace and iNKONOMY

Target: create a dedicated Supabase project for Architect OS. Do not merge Architect OS auth/memory/governance tables into the marketplace project unless explicitly approved.

### GitHub

The owner-controlled GitHub account/session currently does not expose `blackzone2114-web/inkvrse-os`.

Target: create or identify a private owner-controlled repository for Architect OS, then mirror the active branch into it. Preserve commit history where practical. Do not delete the existing source until the target repository has been verified.

## Migration order

1. GitHub: establish private target repository.
2. Mirror `feature/link-architect-os-foundation` and verify all Architect OS files are present.
3. Run CI in the target repository.
4. Supabase: create dedicated Architect OS project and apply migrations in repository order.
5. Configure Vercel project root as `apps/architect-web` and add only required environment variables.
6. Deploy preview and verify `/api/health`, `/`, `/sign-in`, `/approvals`, and `/wargame`.
7. Configure LiveKit only after the web/auth path is verified.
8. Verify LiNK realtime audio, permission governance, audit receipts, and canonical visual asset.
9. Only after all checks pass, retire or disconnect the temporary Vercel/GitHub infrastructure.

## Safety rules

- No secrets in GitHub.
- No service-role key in browser code.
- Keep Architect OS separate from the iNKVERSE marketplace database by default.
- Architect OS remains primary. MONOLITH and other external systems are capability sources only.
- Do not remove the temporary source/deployment until the owner-controlled target is proven working.
