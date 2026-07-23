create type public.opportunity_status as enum ('candidate','queued','recommended','accepted','dismissed','completed','expired');
create type public.assumption_status as enum ('open','testing','verified','rejected','expired');

create table if not exists public.opportunities (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  title text not null,
  problem_statement text not null,
  evidence jsonb not null default '[]'::jsonb,
  source_refs jsonb not null default '[]'::jsonb,
  impact_score integer not null check (impact_score between 0 and 100),
  effort_score integer not null check (effort_score between 0 and 100),
  urgency_score integer not null default 50 check (urgency_score between 0 and 100),
  confidence numeric(4,3) not null check (confidence between 0 and 1),
  reversibility boolean not null default true,
  risk_level text not null default 'low' check (risk_level in ('low','medium','high','critical')),
  proposed_next_action text,
  priority_score numeric generated always as (
    ((impact_score::numeric * confidence * urgency_score::numeric * case when reversibility then 1.10 else 0.85 end) / greatest(effort_score, 10))
  ) stored,
  status public.opportunity_status not null default 'candidate',
  dismissed_reason text,
  review_after timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.assumptions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  statement text not null,
  confidence numeric(4,3) not null default 0.5 check (confidence between 0 and 1),
  evidence_for jsonb not null default '[]'::jsonb,
  evidence_against jsonb not null default '[]'::jsonb,
  test_method text,
  consequence_if_wrong text,
  status public.assumption_status not null default 'open',
  review_at timestamptz,
  verified_memory_id uuid references public.memories(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists opportunities_queue_idx
  on public.opportunities(workspace_id, status, priority_score desc);
create index if not exists assumptions_review_idx
  on public.assumptions(workspace_id, status, review_at);

alter table public.opportunities enable row level security;
alter table public.assumptions enable row level security;

create policy "workspace members read opportunities" on public.opportunities
for select using (public.is_workspace_member(workspace_id));
create policy "workspace members manage opportunities" on public.opportunities
for all using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));

create policy "workspace members read assumptions" on public.assumptions
for select using (public.is_workspace_member(workspace_id));
create policy "workspace members manage assumptions" on public.assumptions
for all using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));

comment on table public.opportunities is 'LiNK Curiosity Engine opportunity queue. Recommendations are evidence-ranked but do not grant execution authority.';
comment on table public.assumptions is 'Explicit unverified assumptions. These must never be treated as verified memory without evidence and promotion.';
