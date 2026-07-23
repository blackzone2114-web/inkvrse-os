create type public.task_outcome as enum ('succeeded','partial','failed','cancelled');
create type public.lesson_kind as enum ('success_pattern','failure_pattern','bottleneck','tool_issue','user_preference','process_improvement');
create type public.improvement_status as enum ('candidate','experiment','preferred','rejected','rolled_back');

create table if not exists public.task_runs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  parent_task_run_id uuid references public.task_runs(id) on delete set null,
  title text not null,
  intent text not null,
  plan jsonb not null default '[]'::jsonb,
  tools_used jsonb not null default '[]'::jsonb,
  outcome public.task_outcome,
  outcome_summary text,
  duration_ms bigint check (duration_ms is null or duration_ms >= 0),
  retry_count integer not null default 0 check (retry_count >= 0),
  friction_score integer not null default 0 check (friction_score between 0 and 100),
  user_satisfaction integer check (user_satisfaction between 0 and 100),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  created_by uuid,
  created_at timestamptz not null default now()
);

create table if not exists public.task_reviews (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  task_run_id uuid not null unique references public.task_runs(id) on delete cascade,
  goal_achieved boolean not null,
  verification_method text not null,
  what_worked jsonb not null default '[]'::jsonb,
  what_failed jsonb not null default '[]'::jsonb,
  bottlenecks jsonb not null default '[]'::jsonb,
  better_next_time jsonb not null default '[]'::jsonb,
  confidence numeric(4,3) not null default 0.5 check (confidence between 0 and 1),
  reviewed_at timestamptz not null default now(),
  reviewer text not null default 'LiNK'
);

create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  task_run_id uuid references public.task_runs(id) on delete set null,
  kind public.lesson_kind not null,
  fingerprint text not null,
  statement text not null,
  evidence jsonb not null default '[]'::jsonb,
  confidence numeric(4,3) not null default 0.5 check (confidence between 0 and 1),
  occurrence_count integer not null default 1 check (occurrence_count > 0),
  last_observed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique(workspace_id, fingerprint)
);

create table if not exists public.workflow_improvements (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  problem text not null,
  proposed_change text not null,
  status public.improvement_status not null default 'candidate',
  evidence_count integer not null default 0 check (evidence_count >= 0),
  confidence numeric(4,3) not null default 0.5 check (confidence between 0 and 1),
  expected_benefit jsonb not null default '{}'::jsonb,
  experiment_rules jsonb not null default '{}'::jsonb,
  previous_version jsonb,
  current_version jsonb,
  promoted_at timestamptz,
  rolled_back_at timestamptz,
  approved_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.improvement_evidence (
  improvement_id uuid not null references public.workflow_improvements(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  supports boolean not null default true,
  weight numeric(4,3) not null default 1 check (weight between 0 and 1),
  created_at timestamptz not null default now(),
  primary key(improvement_id, lesson_id)
);

create table if not exists public.workflow_versions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  improvement_id uuid references public.workflow_improvements(id) on delete set null,
  workflow_key text not null,
  version integer not null check (version > 0),
  definition jsonb not null,
  reason text not null,
  active boolean not null default false,
  created_at timestamptz not null default now(),
  unique(workspace_id, workflow_key, version)
);

create unique index if not exists one_active_workflow_version
  on public.workflow_versions(workspace_id, workflow_key)
  where active = true;

alter table public.task_runs enable row level security;
alter table public.task_reviews enable row level security;
alter table public.lessons enable row level security;
alter table public.workflow_improvements enable row level security;
alter table public.improvement_evidence enable row level security;
alter table public.workflow_versions enable row level security;

create policy "members read task runs" on public.task_runs for select using (public.is_workspace_member(workspace_id));
create policy "members write task runs" on public.task_runs for all using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));
create policy "members read task reviews" on public.task_reviews for select using (public.is_workspace_member(workspace_id));
create policy "members write task reviews" on public.task_reviews for all using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));
create policy "members read lessons" on public.lessons for select using (public.is_workspace_member(workspace_id));
create policy "members write lessons" on public.lessons for all using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));
create policy "members read improvements" on public.workflow_improvements for select using (public.is_workspace_member(workspace_id));
create policy "admins govern improvements" on public.workflow_improvements for all using (public.is_workspace_admin(workspace_id)) with check (public.is_workspace_admin(workspace_id));
create policy "members read improvement evidence" on public.improvement_evidence for select using (exists (select 1 from public.workflow_improvements wi where wi.id = improvement_id and public.is_workspace_member(wi.workspace_id)));
create policy "admins write improvement evidence" on public.improvement_evidence for all using (exists (select 1 from public.workflow_improvements wi where wi.id = improvement_id and public.is_workspace_admin(wi.workspace_id))) with check (exists (select 1 from public.workflow_improvements wi where wi.id = improvement_id and public.is_workspace_admin(wi.workspace_id)));
create policy "members read workflow versions" on public.workflow_versions for select using (public.is_workspace_member(workspace_id));
create policy "admins govern workflow versions" on public.workflow_versions for all using (public.is_workspace_admin(workspace_id)) with check (public.is_workspace_admin(workspace_id));

comment on table public.task_reviews is 'Mandatory post-task reflection for every meaningful LiNK task run.';
comment on table public.workflow_improvements is 'Evidence-backed workflow changes. Candidate improvements never silently modify canon.';