create type public.world_entity_type as enum ('project','feature','service','integration','person','team','artifact','decision','assumption','metric','revenue_stream','risk','workflow','system');
create type public.world_relation_type as enum ('depends_on','powers','blocks','affects','owned_by','implemented_by','measured_by','constrains','enables','funds','feeds','uses','produces','relates_to');

create table if not exists public.world_entities (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  entity_type public.world_entity_type not null,
  name text not null,
  slug text not null,
  description text,
  state jsonb not null default '{}'::jsonb,
  confidence numeric(4,3) not null default 1 check (confidence between 0 and 1),
  source_ref text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(workspace_id, slug)
);

create table if not exists public.world_relations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  from_entity_id uuid not null references public.world_entities(id) on delete cascade,
  to_entity_id uuid not null references public.world_entities(id) on delete cascade,
  relation_type public.world_relation_type not null,
  weight numeric(5,2) not null default 1 check (weight >= 0),
  confidence numeric(4,3) not null default 1 check (confidence between 0 and 1),
  rationale text,
  source_ref text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(from_entity_id, to_entity_id, relation_type)
);

create table if not exists public.impact_analyses (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  source_entity_id uuid references public.world_entities(id) on delete set null,
  proposed_change text not null,
  direct_impacts jsonb not null default '[]'::jsonb,
  downstream_impacts jsonb not null default '[]'::jsonb,
  risks jsonb not null default '[]'::jsonb,
  assumptions jsonb not null default '[]'::jsonb,
  recommendation text,
  confidence numeric(4,3) not null default 0 check (confidence between 0 and 1),
  created_at timestamptz not null default now()
);

create index if not exists world_relations_from_idx on public.world_relations(from_entity_id);
create index if not exists world_relations_to_idx on public.world_relations(to_entity_id);
create index if not exists world_entities_type_idx on public.world_entities(workspace_id, entity_type);

alter table public.world_entities enable row level security;
alter table public.world_relations enable row level security;
alter table public.impact_analyses enable row level security;

create policy world_entities_member_access on public.world_entities
for all using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id));

create policy world_relations_member_access on public.world_relations
for all using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id));

create policy impact_analyses_member_access on public.impact_analyses
for all using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id));
