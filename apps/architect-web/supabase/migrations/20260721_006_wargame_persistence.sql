create table if not exists public.wargame_runs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  created_by uuid not null references auth.users(id) on delete cascade,
  objective text not null,
  decision text not null,
  constraints jsonb not null default '[]'::jsonb,
  assumptions jsonb not null default '[]'::jsonb,
  affected_node_ids jsonb not null default '[]'::jsonb,
  rollback_available boolean not null default false,
  financial_impact numeric not null default 0,
  privacy_impact numeric not null default 0,
  auth_impact numeric not null default 0,
  operational_impact numeric not null default 0,
  confidence numeric not null default 0,
  recommendation_action text not null,
  recommendation_confidence numeric not null,
  recommendation_rationale jsonb not null default '[]'::jsonb,
  required_controls jsonb not null default '[]'::jsonb,
  stop_conditions jsonb not null default '[]'::jsonb,
  review_required boolean not null default false,
  chosen_action text,
  chosen_by uuid references auth.users(id) on delete set null,
  chosen_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.wargame_scenarios (
  id uuid primary key default gen_random_uuid(),
  wargame_run_id uuid not null references public.wargame_runs(id) on delete cascade,
  scenario_key text not null,
  kind text not null,
  title text not null,
  narrative text not null,
  probability numeric not null,
  impact numeric not null,
  reversibility numeric not null,
  assumptions jsonb not null default '[]'::jsonb,
  affected_node_ids jsonb not null default '[]'::jsonb,
  leading_indicators jsonb not null default '[]'::jsonb,
  mitigations jsonb not null default '[]'::jsonb,
  unique (wargame_run_id, scenario_key)
);

create table if not exists public.wargame_outcomes (
  id uuid primary key default gen_random_uuid(),
  wargame_run_id uuid not null unique references public.wargame_runs(id) on delete cascade,
  recorded_by uuid not null references auth.users(id) on delete cascade,
  observed_summary text not null,
  closest_scenario_key text,
  success_score numeric not null default 0,
  rollback_used boolean not null default false,
  rollback_successful boolean,
  predicted_impacts jsonb not null default '[]'::jsonb,
  observed_impacts jsonb not null default '[]'::jsonb,
  missed_dependencies jsonb not null default '[]'::jsonb,
  false_assumptions jsonb not null default '[]'::jsonb,
  prediction_accuracy numeric not null default 0,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists wargame_runs_workspace_created_idx on public.wargame_runs(workspace_id, created_at desc);
create index if not exists wargame_scenarios_run_idx on public.wargame_scenarios(wargame_run_id);
create index if not exists wargame_outcomes_run_idx on public.wargame_outcomes(wargame_run_id);

alter table public.wargame_runs enable row level security;
alter table public.wargame_scenarios enable row level security;
alter table public.wargame_outcomes enable row level security;

create policy "workspace members can read wargame runs"
  on public.wargame_runs for select
  using (public.is_workspace_member(workspace_id));

create policy "workspace members can insert wargame runs"
  on public.wargame_runs for insert
  with check (public.is_workspace_member(workspace_id) and auth.uid() = created_by);

create policy "workspace members can update wargame runs"
  on public.wargame_runs for update
  using (public.is_workspace_member(workspace_id));

create policy "workspace members can read wargame scenarios"
  on public.wargame_scenarios for select
  using (exists (
    select 1 from public.wargame_runs r
    where r.id = wargame_run_id and public.is_workspace_member(r.workspace_id)
  ));

create policy "workspace members can insert wargame scenarios"
  on public.wargame_scenarios for insert
  with check (exists (
    select 1 from public.wargame_runs r
    where r.id = wargame_run_id and public.is_workspace_member(r.workspace_id)
  ));

create policy "workspace members can read wargame outcomes"
  on public.wargame_outcomes for select
  using (exists (
    select 1 from public.wargame_runs r
    where r.id = wargame_run_id and public.is_workspace_member(r.workspace_id)
  ));

create policy "workspace members can insert wargame outcomes"
  on public.wargame_outcomes for insert
  with check (
    auth.uid() = recorded_by and exists (
      select 1 from public.wargame_runs r
      where r.id = wargame_run_id and public.is_workspace_member(r.workspace_id)
    )
  );
