create or replace function public.is_workspace_admin(target_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_workspace_role(target_workspace_id, array['owner','admin']);
$$;

grant execute on function public.is_workspace_admin(uuid) to authenticated;

alter view public.current_memory set (security_invoker = true);

create or replace function public.memory_authority_rank(authority public.memory_authority)
returns integer
language sql
immutable
set search_path = public
as $$
  select case authority
    when 'canon' then 4
    when 'verified' then 3
    when 'inferred' then 2
    when 'suggested' then 1
  end;
$$;

revoke execute on function public.is_workspace_member(uuid) from public;
revoke execute on function public.has_workspace_role(uuid, text[]) from public;
revoke execute on function public.is_workspace_admin(uuid) from public;

grant execute on function public.is_workspace_member(uuid) to authenticated;
grant execute on function public.has_workspace_role(uuid, text[]) to authenticated;
grant execute on function public.is_workspace_admin(uuid) to authenticated;
