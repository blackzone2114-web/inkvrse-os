# Architect OS Supabase Schema Audit

## Verdict

The uploaded schema was a credible prototype, not production-grade. It had the correct domain model and basic RLS, but it could fail on a second run and allowed several ownership-integrity gaps. The hardened file `architect_os_supabase_schema_v1_0_canon.sql` resolves the immediate blockers and is suitable as the canonical fresh-install schema for Phase 3 development.

## Critical issues found and fixed

1. **Reruns could fail.** The original unconditionally recreated triggers, policies, and realtime publication memberships. A second execution could stop with duplicate-object errors. The canonical version drops/recreates triggers and policies safely and checks publication membership before adding tables.

2. **Cross-user foreign-key references were possible.** A user could insert a `lore_entry` linked to another user's universe ID, or a family commitment linked to another user's family member ID, if the UUID became known. RLS hides the parent row but does not automatically prevent the foreign key reference. Composite ownership foreign keys now enforce `(user_id, parent_id)` integrity.

3. **RLS policies were too broad and less efficient.** One `FOR ALL` policy was used per table without an explicit `TO authenticated` role. The canonical version uses separate SELECT, INSERT, UPDATE, and DELETE policies, explicitly limits them to authenticated users, checks that `auth.uid()` is present, and wraps it in `select` for improved query planning.

4. **Missing explicit privileges.** RLS is not a replacement for grants. The canonical version revokes table access from `anon` and grants only CRUD access to `authenticated`.

5. **Insufficient validation.** Importance and relationship strength could be outside 0–1; durations could be negative; empty titles were accepted; decision values were unconstrained; JSON object fields could contain non-object JSON. These now have checks.

6. **Incomplete timestamp coverage.** Only `para_items` had `updated_at` automation. All mutable domain tables now have `updated_at` and safe triggers.

7. **Vector search was stored but not exposed cleanly.** The canonical schema adds RLS-safe `match_memory_embeddings` and `match_lore_entries` RPC functions using cosine distance and bounded result counts.

8. **Weak indexing around RLS and common filters.** User ownership, timeline, status, tags, graph directions, and title search now have targeted indexes. HNSW indexes exclude null embeddings.

9. **Consent gating was only a boolean label.** Consent now requires `consent_recorded_at` when enabled. This is still a database flag, not a complete legal consent workflow. The application must record who obtained consent, the wording/version accepted, revocation, and jurisdiction-specific retention rules if this handles sensitive family information.

10. **Function hardening.** Database functions now use `security invoker` and a fixed `search_path`, reducing privilege and object-shadowing risks.

## Deliberate limitations

- Embedding dimension remains locked to `1536`. The application must use a matching embedding model. Changing dimensions requires a migration and rebuilding vector indexes.
- `memory_embeddings.source_id`, graph endpoints, `loop_cycles.memory_ids`, and `voice_sessions.processed_items` remain polymorphic or array references. PostgreSQL cannot enforce ordinary foreign keys across multiple possible tables. Application validation is required, or these should later be replaced with typed junction tables.
- This schema is single-owner. It does not yet implement organizations, teams, delegated access, shared projects, or role-based collaboration.
- It does not include job queues, audit logs, soft deletion, encryption of especially sensitive fields, rate limits, billing, or retention policies.
- Realtime is enabled only for PARA, memory, loops, and wargames. Lore, family, voice, and graph data remain non-realtime by default to reduce exposure and event volume.

## Deployment order

1. Create a new Supabase project in the Sydney region.
2. Run `architect_os_supabase_schema_v1_0_canon.sql` in the SQL Editor.
3. Confirm there are no errors and rerun it once. The second run is the idempotency smoke test.
4. Create a test Auth user.
5. Test CRUD using the authenticated client.
6. Test that a second test user cannot read, modify, or reference the first user's records.
7. Test realtime in two authenticated tabs for `para_items`.
8. Generate a 1536-dimensional test embedding and call both match RPCs.
9. Keep the service-role key only in server-side environment variables. Never prefix it with `NEXT_PUBLIC_`.
10. Commit this SQL as the canonical baseline migration before adding Phase 3 features.

## Production gate

Call Phase 3 backend-ready only after the following pass:

- Schema runs twice without failure.
- RLS isolation tests pass for every table.
- Cross-user parent-reference tests fail as expected.
- Realtime delivers only rows allowed by RLS.
- Vector RPCs return only the signed-in user's records.
- Service-role credentials are absent from browser bundles and logs.
- Backup and restore are tested before importing irreplaceable lore, family, or business data.
