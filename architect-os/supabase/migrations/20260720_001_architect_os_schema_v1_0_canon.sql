-- ============================================================================
-- ARCHITECT OS — Supabase Schema v1.0 CANON
-- Hardened, idempotent, RLS-first, realtime-ready, pgvector-enabled.
-- Target: a fresh Supabase project. Use migrations for an existing database.
-- Embedding dimension: 1536. Keep the app embedding model aligned with this.
-- ============================================================================

begin;

-- Extensions
create extension if not exists pgcrypto;
create extension if not exists vector;
create extension if not exists pg_trgm;

-- --------------------------------------------------------------------------
-- Shared trigger function
-- --------------------------------------------------------------------------
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- --------------------------------------------------------------------------
-- Core: PARA
-- --------------------------------------------------------------------------
create table if not exists public.para_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null check (category in ('project', 'area', 'resource', 'archive')),
  item_type text not null check (item_type in ('container', 'note', 'task', 'link', 'decision')),
  pod_assignment text check (pod_assignment in ('core', 'wargame', 'lore', 'family', 'memory')),
  title text not null check (length(btrim(title)) > 0),
  body text,
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  embedding vector(1536),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, id)
);

create index if not exists para_items_embedding_hnsw_idx
  on public.para_items using hnsw (embedding vector_cosine_ops)
  where embedding is not null;
create index if not exists para_items_user_category_idx
  on public.para_items (user_id, category);
create index if not exists para_items_user_pod_idx
  on public.para_items (user_id, pod_assignment)
  where pod_assignment is not null;
create index if not exists para_items_user_updated_idx
  on public.para_items (user_id, updated_at desc);
create index if not exists para_items_title_trgm_idx
  on public.para_items using gin (title gin_trgm_ops);

-- --------------------------------------------------------------------------
-- Memory Engine
-- --------------------------------------------------------------------------
create table if not exists public.memory_embeddings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source_type text not null check (length(btrim(source_type)) > 0),
  source_id uuid,
  content text not null check (length(btrim(content)) > 0),
  embedding vector(1536),
  importance real not null default 0.5 check (importance between 0 and 1),
  tags text[] not null default '{}'::text[],
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, id)
);

create index if not exists memory_embeddings_embedding_hnsw_idx
  on public.memory_embeddings using hnsw (embedding vector_cosine_ops)
  where embedding is not null;
create index if not exists memory_embeddings_user_created_idx
  on public.memory_embeddings (user_id, created_at desc);
create index if not exists memory_embeddings_user_source_idx
  on public.memory_embeddings (user_id, source_type, source_id);
create index if not exists memory_embeddings_tags_gin_idx
  on public.memory_embeddings using gin (tags);

-- --------------------------------------------------------------------------
-- Wargame Pod
-- --------------------------------------------------------------------------
create table if not exists public.wargame_evaluations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  idea_title text not null check (length(btrim(idea_title)) > 0),
  idea_body text,
  pre_mortem jsonb,
  bull_case jsonb,
  bear_case jsonb,
  precedent_cases jsonb,
  risk_level text check (risk_level in ('low', 'medium', 'high', 'critical')),
  pattern_matches jsonb,
  decision text check (decision in ('approved', 'rejected', 'needs_more_info')),
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, id),
  check (decision is null or decided_at is not null)
);

create index if not exists wargame_user_created_idx
  on public.wargame_evaluations (user_id, created_at desc);
create index if not exists wargame_user_risk_idx
  on public.wargame_evaluations (user_id, risk_level)
  where risk_level is not null;

-- --------------------------------------------------------------------------
-- Lore Pod
-- --------------------------------------------------------------------------
create table if not exists public.lore_universes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (length(btrim(name)) > 0),
  description text,
  canon_rules jsonb not null default '{}'::jsonb check (jsonb_typeof(canon_rules) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, id),
  unique (user_id, name)
);

create table if not exists public.lore_entries (
  id uuid primary key default gen_random_uuid(),
  universe_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  entry_type text not null check (entry_type in ('character', 'event', 'location', 'rule', 'timeline', 'faction', 'object', 'concept', 'chapter', 'other')),
  title text not null check (length(btrim(title)) > 0),
  content text,
  embedding vector(1536),
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, id),
  constraint lore_entries_owned_universe_fk
    foreign key (user_id, universe_id)
    references public.lore_universes(user_id, id)
    on delete cascade
);

create index if not exists lore_universes_user_idx
  on public.lore_universes (user_id, updated_at desc);
create index if not exists lore_entries_embedding_hnsw_idx
  on public.lore_entries using hnsw (embedding vector_cosine_ops)
  where embedding is not null;
create index if not exists lore_entries_user_universe_idx
  on public.lore_entries (user_id, universe_id, entry_type);
create index if not exists lore_entries_title_trgm_idx
  on public.lore_entries using gin (title gin_trgm_ops);

-- --------------------------------------------------------------------------
-- Family / Life Pod
-- --------------------------------------------------------------------------
create table if not exists public.family_members (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (length(btrim(name)) > 0),
  relationship text,
  consent_for_ai_processing boolean not null default false,
  consent_recorded_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, id),
  check (not consent_for_ai_processing or consent_recorded_at is not null)
);

create table if not exists public.family_commitments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  family_member_id uuid,
  commitment text not null check (length(btrim(commitment)) > 0),
  status text not null default 'active' check (status in ('active', 'completed', 'cancelled')),
  due_date date,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, id),
  constraint family_commitments_owned_member_fk
    foreign key (user_id, family_member_id)
    references public.family_members(user_id, id)
    on delete set null (family_member_id),
  check (status <> 'completed' or completed_at is not null)
);

create index if not exists family_members_user_idx
  on public.family_members (user_id, updated_at desc);
create index if not exists family_commitments_user_status_due_idx
  on public.family_commitments (user_id, status, due_date);

-- --------------------------------------------------------------------------
-- Loop Synthesis
-- --------------------------------------------------------------------------
create table if not exists public.loop_cycles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  cycle_type text not null check (cycle_type in ('daily', 'weekly', 'monthly', 'manual')),
  period_start timestamptz,
  period_end timestamptz,
  summary text,
  re_prioritization_suggestions jsonb,
  memory_ids uuid[] not null default '{}'::uuid[],
  synthesis_prompt_refinements text[] not null default '{}'::text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, id),
  check (period_end is null or period_start is null or period_end >= period_start)
);

create index if not exists loop_cycles_user_type_created_idx
  on public.loop_cycles (user_id, cycle_type, created_at desc);

-- --------------------------------------------------------------------------
-- Voice / Tank History
-- --------------------------------------------------------------------------
create table if not exists public.voice_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  transcript text,
  processed_items uuid[] not null default '{}'::uuid[],
  duration_seconds integer check (duration_seconds is null or duration_seconds >= 0),
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, id)
);

create index if not exists voice_sessions_user_created_idx
  on public.voice_sessions (user_id, created_at desc);

-- --------------------------------------------------------------------------
-- Knowledge Graph
-- --------------------------------------------------------------------------
create table if not exists public.connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  from_id uuid not null,
  from_type text not null check (length(btrim(from_type)) > 0),
  to_id uuid not null,
  to_type text not null check (length(btrim(to_type)) > 0),
  relation_type text not null check (length(btrim(relation_type)) > 0),
  strength real not null default 0.5 check (strength between 0 and 1),
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, from_type, from_id, to_type, to_id, relation_type),
  check (from_id <> to_id or from_type <> to_type)
);

create index if not exists connections_user_from_idx
  on public.connections (user_id, from_type, from_id);
create index if not exists connections_user_to_idx
  on public.connections (user_id, to_type, to_id);
create index if not exists connections_user_relation_idx
  on public.connections (user_id, relation_type);

-- --------------------------------------------------------------------------
-- Idempotent updated_at triggers
-- --------------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array[
    'para_items', 'memory_embeddings', 'wargame_evaluations',
    'lore_universes', 'lore_entries', 'family_members',
    'family_commitments', 'loop_cycles', 'voice_sessions', 'connections'
  ]
  loop
    execute format('drop trigger if exists %I on public.%I', t || '_set_updated_at', t);
    execute format(
      'create trigger %I before update on public.%I for each row execute function public.handle_updated_at()',
      t || '_set_updated_at', t
    );
  end loop;
end $$;

-- --------------------------------------------------------------------------
-- RLS and explicit authenticated grants
-- --------------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array[
    'para_items', 'memory_embeddings', 'wargame_evaluations',
    'lore_universes', 'lore_entries', 'family_members',
    'family_commitments', 'loop_cycles', 'voice_sessions', 'connections'
  ]
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on table public.%I from anon', t);
    execute format('grant select, insert, update, delete on table public.%I to authenticated', t);
    execute format('drop policy if exists %I on public.%I', t || '_select_own', t);
    execute format('drop policy if exists %I on public.%I', t || '_insert_own', t);
    execute format('drop policy if exists %I on public.%I', t || '_update_own', t);
    execute format('drop policy if exists %I on public.%I', t || '_delete_own', t);
    execute format(
      'create policy %I on public.%I for select to authenticated using ((select auth.uid()) is not null and (select auth.uid()) = user_id)',
      t || '_select_own', t
    );
    execute format(
      'create policy %I on public.%I for insert to authenticated with check ((select auth.uid()) is not null and (select auth.uid()) = user_id)',
      t || '_insert_own', t
    );
    execute format(
      'create policy %I on public.%I for update to authenticated using ((select auth.uid()) is not null and (select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)',
      t || '_update_own', t
    );
    execute format(
      'create policy %I on public.%I for delete to authenticated using ((select auth.uid()) is not null and (select auth.uid()) = user_id)',
      t || '_delete_own', t
    );
  end loop;
end $$;

-- --------------------------------------------------------------------------
-- Vector search RPCs. Security invoker means RLS remains enforced.
-- --------------------------------------------------------------------------
create or replace function public.match_memory_embeddings(
  query_embedding vector(1536),
  match_threshold real default 0.70,
  match_count integer default 10,
  filter_tags text[] default null
)
returns table (
  id uuid,
  source_type text,
  source_id uuid,
  content text,
  importance real,
  tags text[],
  metadata jsonb,
  similarity real,
  created_at timestamptz
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    m.id,
    m.source_type,
    m.source_id,
    m.content,
    m.importance,
    m.tags,
    m.metadata,
    (1 - (m.embedding <=> query_embedding))::real as similarity,
    m.created_at
  from public.memory_embeddings m
  where m.embedding is not null
    and ((select auth.uid()) is not null and m.user_id = (select auth.uid()))
    and 1 - (m.embedding <=> query_embedding) >= match_threshold
    and (filter_tags is null or m.tags && filter_tags)
  order by m.embedding <=> query_embedding
  limit greatest(1, least(match_count, 100));
$$;

create or replace function public.match_lore_entries(
  query_embedding vector(1536),
  target_universe_id uuid default null,
  match_threshold real default 0.70,
  match_count integer default 10
)
returns table (
  id uuid,
  universe_id uuid,
  entry_type text,
  title text,
  content text,
  metadata jsonb,
  similarity real,
  created_at timestamptz
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    l.id,
    l.universe_id,
    l.entry_type,
    l.title,
    l.content,
    l.metadata,
    (1 - (l.embedding <=> query_embedding))::real as similarity,
    l.created_at
  from public.lore_entries l
  where l.embedding is not null
    and ((select auth.uid()) is not null and l.user_id = (select auth.uid()))
    and (target_universe_id is null or l.universe_id = target_universe_id)
    and 1 - (l.embedding <=> query_embedding) >= match_threshold
  order by l.embedding <=> query_embedding
  limit greatest(1, least(match_count, 100));
$$;

revoke all on function public.match_memory_embeddings(vector, real, integer, text[]) from public, anon;
grant execute on function public.match_memory_embeddings(vector, real, integer, text[]) to authenticated;
revoke all on function public.match_lore_entries(vector, uuid, real, integer) from public, anon;
grant execute on function public.match_lore_entries(vector, uuid, real, integer) to authenticated;

-- --------------------------------------------------------------------------
-- Realtime publication, safe to rerun
-- --------------------------------------------------------------------------
do $$
declare
  t text;
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    foreach t in array array['para_items', 'memory_embeddings', 'loop_cycles', 'wargame_evaluations']
    loop
      if not exists (
        select 1
        from pg_publication_tables
        where pubname = 'supabase_realtime'
          and schemaname = 'public'
          and tablename = t
      ) then
        execute format('alter publication supabase_realtime add table public.%I', t);
      end if;
    end loop;
  end if;
end $$;

commit;

-- End of Architect OS Schema v1.0 CANON
