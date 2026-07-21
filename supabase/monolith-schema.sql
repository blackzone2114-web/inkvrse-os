-- MONOLITH OS v1 schema
-- Run in Supabase SQL editor after reviewing policies for your deployment.

create extension if not exists "pgcrypto";
create extension if not exists "vector";

create type public.monolith_capture_type as enum ('idea', 'task', 'decision', 'memory', 'note', 'reference');
create type public.monolith_mission_status as enum ('backlog', 'active', 'blocked', 'review', 'complete', 'archived');
create type public.monolith_workspace_type as enum ('personal', 'business', 'inkvrse', 'earthfall', 'custom');

create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  slug text not null,
  type public.monolith_workspace_type not null default 'custom',
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(owner_id, slug)
);

create table public.captures (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  workspace_id uuid references public.workspaces(id) on delete set null,
  type public.monolith_capture_type not null default 'note',
  title text,
  content text not null,
  source text not null default 'manual',
  source_url text,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.memories (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  workspace_id uuid references public.workspaces(id) on delete set null,
  capture_id uuid references public.captures(id) on delete set null,
  summary text not null,
  body text,
  importance smallint not null default 3 check (importance between 1 and 5),
  confidence numeric(4,3) not null default 1.000 check (confidence between 0 and 1),
  embedding vector(1536),
  valid_from timestamptz not null default now(),
  valid_until timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.knowledge_nodes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  workspace_id uuid references public.workspaces(id) on delete set null,
  node_type text not null,
  label text not null,
  description text,
  properties jsonb not null default '{}'::jsonb,
  embedding vector(1536),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.knowledge_edges (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  from_node_id uuid not null references public.knowledge_nodes(id) on delete cascade,
  to_node_id uuid not null references public.knowledge_nodes(id) on delete cascade,
  relation text not null,
  weight numeric(5,4) not null default 1.0000,
  properties jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(from_node_id, to_node_id, relation)
);

create table public.missions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  workspace_id uuid references public.workspaces(id) on delete set null,
  parent_id uuid references public.missions(id) on delete set null,
  title text not null,
  objective text,
  status public.monolith_mission_status not null default 'backlog',
  priority smallint not null default 3 check (priority between 1 and 5),
  progress smallint not null default 0 check (progress between 0 and 100),
  due_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  mission_id uuid references public.missions(id) on delete cascade,
  title text not null,
  description text,
  status text not null default 'todo',
  sort_order integer not null default 0,
  due_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.decisions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  workspace_id uuid references public.workspaces(id) on delete set null,
  mission_id uuid references public.missions(id) on delete set null,
  question text not null,
  decision text not null,
  rationale text,
  alternatives jsonb not null default '[]'::jsonb,
  consequences jsonb not null default '[]'::jsonb,
  decided_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table public.ai_runs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  workspace_id uuid references public.workspaces(id) on delete set null,
  mission_id uuid references public.missions(id) on delete set null,
  department text not null,
  model text,
  prompt text not null,
  response text,
  status text not null default 'queued',
  input_tokens integer,
  output_tokens integer,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table public.evolution_events (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  workspace_id uuid references public.workspaces(id) on delete set null,
  event_type text not null,
  observation text not null,
  recommendation text,
  evidence jsonb not null default '[]'::jsonb,
  status text not null default 'new',
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create index captures_owner_created_idx on public.captures(owner_id, created_at desc);
create index memories_owner_created_idx on public.memories(owner_id, created_at desc);
create index missions_owner_status_idx on public.missions(owner_id, status);
create index knowledge_nodes_owner_type_idx on public.knowledge_nodes(owner_id, node_type);
create index memories_embedding_idx on public.memories using ivfflat (embedding vector_cosine_ops) with (lists = 100);
create index knowledge_nodes_embedding_idx on public.knowledge_nodes using ivfflat (embedding vector_cosine_ops) with (lists = 100);

alter table public.workspaces enable row level security;
alter table public.captures enable row level security;
alter table public.memories enable row level security;
alter table public.knowledge_nodes enable row level security;
alter table public.knowledge_edges enable row level security;
alter table public.missions enable row level security;
alter table public.tasks enable row level security;
alter table public.decisions enable row level security;
alter table public.ai_runs enable row level security;
alter table public.evolution_events enable row level security;

create policy "owners manage workspaces" on public.workspaces for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "owners manage captures" on public.captures for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "owners manage memories" on public.memories for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "owners manage knowledge nodes" on public.knowledge_nodes for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "owners manage knowledge edges" on public.knowledge_edges for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "owners manage missions" on public.missions for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "owners manage tasks" on public.tasks for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "owners manage decisions" on public.decisions for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "owners manage ai runs" on public.ai_runs for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "owners manage evolution events" on public.evolution_events for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
