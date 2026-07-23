create table if not exists public.workspace_members (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner','admin','member','viewer')),
  created_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

alter table public.workspace_members enable row level security;

create or replace function public.is_workspace_member(target_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = target_workspace_id
      and wm.user_id = auth.uid()
  ) or exists (
    select 1
    from public.workspaces w
    where w.id = target_workspace_id
      and w.owner_id = auth.uid()
  );
$$;

create or replace function public.has_workspace_role(target_workspace_id uuid, allowed_roles text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = target_workspace_id
      and wm.user_id = auth.uid()
      and wm.role = any(allowed_roles)
  ) or exists (
    select 1
    from public.workspaces w
    where w.id = target_workspace_id
      and w.owner_id = auth.uid()
      and 'owner' = any(allowed_roles)
  );
$$;

create policy "workspace owners can read"
on public.workspaces for select
to authenticated
using (owner_id = auth.uid() or public.is_workspace_member(id));

create policy "users can create owned workspaces"
on public.workspaces for insert
to authenticated
with check (owner_id = auth.uid());

create policy "workspace owners can update"
on public.workspaces for update
to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

create policy "members can read memberships"
on public.workspace_members for select
to authenticated
using (public.is_workspace_member(workspace_id));

create policy "owners manage memberships"
on public.workspace_members for all
to authenticated
using (public.has_workspace_role(workspace_id, array['owner','admin']))
with check (public.has_workspace_role(workspace_id, array['owner','admin']));

create policy "members read projects"
on public.projects for select
to authenticated
using (public.is_workspace_member(workspace_id));

create policy "members write projects"
on public.projects for all
to authenticated
using (public.has_workspace_role(workspace_id, array['owner','admin','member']))
with check (public.has_workspace_role(workspace_id, array['owner','admin','member']));

create policy "members read memories"
on public.memories for select
to authenticated
using (public.is_workspace_member(workspace_id));

create policy "members propose memories"
on public.memories for insert
to authenticated
with check (
  public.has_workspace_role(workspace_id, array['owner','admin','member'])
  and (authority <> 'canon' or public.has_workspace_role(workspace_id, array['owner','admin']))
);

create policy "admins update memories"
on public.memories for update
to authenticated
using (public.has_workspace_role(workspace_id, array['owner','admin']))
with check (public.has_workspace_role(workspace_id, array['owner','admin']));

create policy "members read operational events"
on public.operational_events for select
to authenticated
using (public.is_workspace_member(workspace_id));

create policy "members create operational events"
on public.operational_events for insert
to authenticated
with check (public.has_workspace_role(workspace_id, array['owner','admin','member']));

create policy "members resolve operational events"
on public.operational_events for update
to authenticated
using (public.has_workspace_role(workspace_id, array['owner','admin','member']))
with check (public.has_workspace_role(workspace_id, array['owner','admin','member']));

create policy "members manage own device presence"
on public.presence_sessions for all
to authenticated
using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id));

create policy "members read tool receipts"
on public.tool_receipts for select
to authenticated
using (public.is_workspace_member(workspace_id));

create policy "members create tool receipts"
on public.tool_receipts for insert
to authenticated
with check (public.has_workspace_role(workspace_id, array['owner','admin','member']));

grant execute on function public.is_workspace_member(uuid) to authenticated;
grant execute on function public.has_workspace_role(uuid, text[]) to authenticated;

grant select on public.current_memory to authenticated;
