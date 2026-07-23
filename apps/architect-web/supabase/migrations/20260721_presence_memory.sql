create extension if not exists pgcrypto;

create type public.memory_authority as enum ('canon','verified','inferred','suggested');
create type public.memory_status as enum ('active','superseded','archived','deleted');
create type public.event_severity as enum ('info','attention','warning','critical');

create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  name text not null,
  timezone text not null default 'Australia/Melbourne',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  status text not null default 'active',
  priority integer not null default 50 check (priority between 0 and 100),
  next_action text,
  blocked_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.memories (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  subject text not null,
  predicate text not null,
  object_text text not null,
  authority public.memory_authority not null default 'suggested',
  status public.memory_status not null default 'active',
  confidence numeric(4,3) not null default 1 check (confidence between 0 and 1),
  source_type text not null,
  source_ref text,
  valid_from timestamptz not null default now(),
  valid_until timestamptz,
  supersedes_id uuid references public.memories(id) on delete set null,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists memories_active_canon_unique
  on public.memories(workspace_id, subject, predicate)
  where authority = 'canon' and status = 'active';

create table if not exists public.operational_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  event_type text not null,
  title text not null,
  summary text,
  severity public.event_severity not null default 'info',
  requires_approval boolean not null default false,
  resolved_at timestamptz,
  source_tool text,
  source_ref text,
  payload jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.presence_sessions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  device_id text not null,
  local_timezone text not null,
  active_project_id uuid references public.projects(id) on delete set null,
  last_seen_at timestamptz not null default now(),
  last_briefed_event_at timestamptz,
  state jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(workspace_id, device_id)
);

create table if not exists public.tool_receipts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  event_id uuid references public.operational_events(id) on delete set null,
  tool_name text not null,
  action text not null,
  permission_level integer not null check (permission_level between 0 and 3),
  result text not null check (result in ('prepared','succeeded','failed','cancelled')),
  reversible boolean not null default true,
  external_ref text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create or replace function public.memory_authority_rank(authority public.memory_authority)
returns integer language sql immutable as $$
  select case authority
    when 'canon' then 4
    when 'verified' then 3
    when 'inferred' then 2
    when 'suggested' then 1
  end;
$$;

create or replace view public.current_memory as
select distinct on (workspace_id, subject, predicate)
  *
from public.memories
where status = 'active'
  and (valid_until is null or valid_until > now())
order by workspace_id, subject, predicate,
  public.memory_authority_rank(authority) desc,
  confidence desc,
  updated_at desc;

alter table public.workspaces enable row level security;
alter table public.projects enable row level security;
alter table public.memories enable row level security;
alter table public.operational_events enable row level security;
alter table public.presence_sessions enable row level security;
alter table public.tool_receipts enable row level security;

comment on view public.current_memory is 'Resolved source-of-truth memory. Canon outranks verified, inferred, then suggested records.';
