-- Live hardening synced from the Architect OS Supabase project.

create or replace function public.is_workspace_admin(target_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_workspace_role(target_workspace_id, array['owner','admin']);
$$;

alter function public.memory_authority_rank(public.memory_authority)
  set search_path = public;

alter view public.current_memory set (security_invoker = true);

revoke execute on function public.is_workspace_member(uuid) from public, anon;
revoke execute on function public.has_workspace_role(uuid, text[]) from public, anon;
revoke execute on function public.is_workspace_admin(uuid) from public, anon;
grant execute on function public.is_workspace_member(uuid) to authenticated;
grant execute on function public.has_workspace_role(uuid, text[]) to authenticated;
grant execute on function public.is_workspace_admin(uuid) to authenticated;

create index if not exists projects_workspace_id_idx on public.projects(workspace_id);
create index if not exists operational_events_workspace_id_idx on public.operational_events(workspace_id);
create index if not exists operational_events_project_id_idx on public.operational_events(project_id);
create index if not exists memories_project_id_idx on public.memories(project_id);
create index if not exists memories_supersedes_id_idx on public.memories(supersedes_id);
create index if not exists presence_sessions_active_project_id_idx on public.presence_sessions(active_project_id);
create index if not exists tool_receipts_workspace_id_idx on public.tool_receipts(workspace_id);
create index if not exists tool_receipts_event_id_idx on public.tool_receipts(event_id);
create index if not exists task_runs_workspace_id_idx on public.task_runs(workspace_id);
create index if not exists task_runs_project_id_idx on public.task_runs(project_id);
create index if not exists task_runs_parent_id_idx on public.task_runs(parent_task_run_id);
create index if not exists task_reviews_workspace_id_idx on public.task_reviews(workspace_id);
create index if not exists lessons_task_run_id_idx on public.lessons(task_run_id);
create index if not exists assumptions_project_id_idx on public.assumptions(project_id);
create index if not exists assumptions_verified_memory_id_idx on public.assumptions(verified_memory_id);
create index if not exists impact_analyses_workspace_id_idx on public.impact_analyses(workspace_id);
create index if not exists impact_analyses_source_entity_id_idx on public.impact_analyses(source_entity_id);
create index if not exists improvement_evidence_lesson_id_idx on public.improvement_evidence(lesson_id);
create index if not exists workflow_improvements_workspace_id_idx on public.workflow_improvements(workspace_id);
create index if not exists workflow_versions_improvement_id_idx on public.workflow_versions(improvement_id);
create index if not exists workspace_members_user_id_idx on public.workspace_members(user_id);
create index if not exists world_entities_project_id_idx on public.world_entities(project_id);
create index if not exists world_relations_workspace_id_idx on public.world_relations(workspace_id);
create index if not exists wargame_runs_project_id_idx on public.wargame_runs(project_id);
create index if not exists wargame_runs_created_by_idx on public.wargame_runs(created_by);
create index if not exists wargame_runs_chosen_by_idx on public.wargame_runs(chosen_by);
create index if not exists wargame_outcomes_recorded_by_idx on public.wargame_outcomes(recorded_by);
create index if not exists approval_requests_execution_receipt_idx on public.approval_requests(execution_receipt_id);
