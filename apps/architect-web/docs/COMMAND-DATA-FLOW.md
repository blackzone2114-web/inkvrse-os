# Command Data Flow

## Request path

1. Next.js server component requests `getCommandSnapshot()`.
2. The Supabase server client restores and refreshes the authenticated session.
3. Row-level security limits every query to workspaces owned by or shared with the authenticated user.
4. The Command loader retrieves unresolved approvals, blocked projects, recent events and resolved canon memory.
5. The server renders a minimal operational briefing. No service-role key reaches the browser.
6. When Supabase is not configured or no user is authenticated, the interface enters clearly labelled Safe Preview mode.

## Trust rules

- Canon memory outranks verified, inferred and suggested memory.
- Canon writes require owner or administrator authority.
- External operations must create tool receipts.
- High-impact operations remain approval-gated.
- Preview records are never represented as live account data.

## Bootstrap

The idempotent `bootstrapWorkspace` server action creates the first Architect OS workspace, owner membership, four core LiNK canon records and one bootstrap event. It does not overwrite existing canon.

## Next implementation gate

Add the authentication screen and invoke workspace bootstrap after first successful sign-in. Then replace preview content with the authenticated Command snapshot and connect the canonical LiNK image asset.
