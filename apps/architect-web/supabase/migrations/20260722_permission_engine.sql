create type public.approval_status as enum ('pending','approved','rejected','expired','cancelled');

create table if not exists public.approval_requests (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  requested_by uuid not null,
  requested_via text not null default 'link',
  tool_name text not null,
  action text not null,
  summary text not null,
  permission_level integer not null check (permission_level between 0 and 3),
  risk_level integer not null default 0 check (risk_level between 0 and 100),
  reversible boolean not null default true,
  requires_wargame boolean not null default false,
  payload jsonb not null default '{}'::jsonb,
  status public.approval_status not null default 'pending',
  decided_by uuid,
  decided_at timestamptz,
  expires_at timestamptz,
  execution_receipt_id uuid references public.tool_receipts(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists approval_requests_workspace_status_idx
  on public.approval_requests(workspace_id, status, created_at desc);

alter table public.approval_requests enable row level security;

create policy "members read approval requests"
on public.approval_requests for select
to authenticated
using (public.is_workspace_member(workspace_id));

create policy "members create approval requests"
on public.approval_requests for insert
to authenticated
with check (
  requested_by = auth.uid()
  and public.has_workspace_role(workspace_id, array['owner','admin','member'])
);

create policy "owners and admins decide approvals"
on public.approval_requests for update
to authenticated
using (public.has_workspace_role(workspace_id, array['owner','admin']))
with check (public.has_workspace_role(workspace_id, array['owner','admin']));

comment on table public.approval_requests is 'Human approval gate for consequential LiNK actions. Approval is separate from execution and never implies success.';
