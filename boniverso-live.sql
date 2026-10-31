-- Execute no SQL Editor do projeto BoniVerso-RSB, uma vez.
create table if not exists public.live_speaking_requests (
 id uuid primary key default gen_random_uuid(),
 session_id uuid not null references public.live_sessions(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 status text not null default 'pending' check (status in ('pending','approved','denied')),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(session_id,user_id)
);
alter table public.live_speaking_requests enable row level security;
create or replace function public.can_join_boniverso_live(p_session uuid)
returns boolean language sql stable security invoker set search_path=public as $$
 select exists(
  select 1 from public.live_sessions s
  join public.classrooms c on c.id=s.classroom_id
  where s.id=p_session and c.is_active and s.status='live'
  and (
    public.current_staff_role() in ('admin','teacher')
    or exists (select 1 from public.classroom_memberships m where m.classroom_id=s.classroom_id and m.user_id=(select auth.uid()) and m.status='active')
  )
 );
$$;
revoke all on function public.can_join_boniverso_live(uuid) from public;
grant execute on function public.can_join_boniverso_live(uuid) to authenticated;
create policy live_request_read on public.live_speaking_requests for select to authenticated using (
 user_id=(select auth.uid()) or public.current_staff_role() in ('admin','teacher')
);
create policy live_request_insert on public.live_speaking_requests for insert to authenticated with check (
 user_id=(select auth.uid()) and status='pending' and public.can_join_boniverso_live(session_id)
);
create policy live_request_update on public.live_speaking_requests for update to authenticated
using (public.current_staff_role() in ('admin','teacher'))
with check (public.current_staff_role() in ('admin','teacher'));
grant select,insert,update on public.live_speaking_requests to authenticated;
