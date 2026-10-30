-- BONIVERSO / INSTITUTO RSB EDUCAÇÃO
-- BASE DE DADOS PREPARATÓRIA (NÃO EXECUTADA NEM TESTADA EM UM PROJETO SUPABASE)
-- Revise e execute por migração após definir um projeto dedicado e contas da equipe.
-- Não contém integração financeira, contas reais ou liberação automática de assinaturas.

create schema if not exists private;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Estudante',
  avatar_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Papéis editoriais são atribuídos exclusivamente por servidor/administrador.
-- Nunca autorize o perfil de professor com dados editáveis pelo usuário.
create table if not exists private.staff_members (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('admin','teacher')),
  created_at timestamptz not null default now()
);

create or replace function private.is_staff()
returns boolean language sql stable security definer set search_path = '' as $$
  select auth.uid() is not null and exists
    (select 1 from private.staff_members s where s.user_id = auth.uid());
$$;
revoke all on function private.is_staff() from public, anon;
grant usage on schema private to authenticated;
grant execute on function private.is_staff() to authenticated;

create table if not exists public.plans (
  id text primary key check (id in ('basic','plus','prime')),
  name text not null,
  monthly_price_cents integer not null check (monthly_price_cents>=0),
  tier integer unique not null check (tier between 1 and 3),
  is_active boolean not null default false
);
insert into public.plans (id,name,monthly_price_cents,tier,is_active) values
('basic','BoniVerso Básico',1990,1,false),
('plus','BoniVerso Plus',4990,2,false),
('prime','BoniVerso Prime',8990,3,false)
on conflict (id) do nothing;

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_id text not null references public.plans(id),
  status text not null check (status in ('trialing','active','past_due','canceled','expired')),
  valid_until timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists idx_subscriptions_user on public.subscriptions(user_id, status, valid_until);

create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  summary text not null default '',
  category text not null default 'Geral',
  cover_path text,
  price_cents integer not null default 0 check (price_cents>=0),
  required_plan text references public.plans(id),
  is_free boolean not null default false,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.enrollments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  source text not null check (source in ('purchase','promotion','admin_grant')),
  valid_until timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, course_id)
);
create index if not exists idx_enrollments_user on public.enrollments(user_id);

-- Acesso calculado no banco, não em informações manipuláveis pelo dispositivo.
create or replace function private.has_course_access(p_course_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select auth.uid() is not null and (
    (select private.is_staff())
    or exists (
      select 1 from public.courses c where c.id=p_course_id and c.published and (
        c.is_free
        or exists (select 1 from public.enrollments e where e.course_id=c.id and e.user_id=auth.uid()
          and (e.valid_until is null or e.valid_until > now()))
        or exists (select 1 from public.subscriptions s
          join public.plans sp on sp.id=s.plan_id
          join public.plans cp on cp.id=c.required_plan
          where s.user_id=auth.uid() and s.status='active' and s.valid_until>now()
            and sp.tier>=cp.tier)
      )
    )
  );
$$;
revoke all on function private.has_course_access(uuid) from public, anon;
grant execute on function private.has_course_access(uuid) to authenticated;

create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null,
  description text not null default '',
  video_provider text,
  video_reference text,
  duration_seconds integer not null default 0 check (duration_seconds>=0),
  position integer not null default 0,
  published boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists idx_lessons_course on public.lessons(course_id,position);

create table if not exists public.materials (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  file_name text not null,
  storage_path text not null unique,
  mime_type text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.lesson_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  completed_at timestamptz not null default now(),
  primary key(user_id,lesson_id)
);

create table if not exists public.study_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  subject text,
  due_date date,
  completed boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.assignments (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null,
  instructions text not null,
  due_at timestamptz,
  max_points integer not null default 1000 check(max_points>0),
  published boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
  status text not null default 'submitted' check (status in ('submitted','graded')),
  score integer check (score between 0 and 1000),
  feedback text,
  competencies jsonb,
  submitted_at timestamptz not null default now(),
  graded_at timestamptz
);
create index if not exists idx_submissions_user on public.submissions(user_id,submitted_at desc);

-- Proteção obrigatória em todas as tabelas expostas pela Data API.
alter table public.profiles enable row level security;
alter table public.plans enable row level security;
alter table public.subscriptions enable row level security;
alter table public.courses enable row level security;
alter table public.enrollments enable row level security;
alter table public.lessons enable row level security;
alter table public.materials enable row level security;
alter table public.lesson_progress enable row level security;
alter table public.study_tasks enable row level security;
alter table public.assignments enable row level security;
alter table public.submissions enable row level security;
alter table private.staff_members enable row level security;

-- Políticas de exemplo. Nenhuma permissão anônima permite alterar dados.
create policy profiles_read on public.profiles for select to authenticated
using (id=(select auth.uid()) or (select private.is_staff()));
create policy profiles_update on public.profiles for update to authenticated
using (id=(select auth.uid())) with check (id=(select auth.uid()));
create policy plans_catalog on public.plans for select to anon, authenticated using (true);
create policy plans_manage on public.plans for all to authenticated using ((select private.is_staff())) with check ((select private.is_staff()));
create policy subscriptions_read on public.subscriptions for select to authenticated
using (user_id=(select auth.uid()) or (select private.is_staff()));
-- Escrita em subscriptions: SOMENTE servidor de pagamento, com credenciais secretas.
create policy courses_catalog on public.courses for select to anon, authenticated using (published or (select private.is_staff()));
create policy courses_staff_manage on public.courses for all to authenticated using ((select private.is_staff())) with check ((select private.is_staff()));
create policy enrollments_read on public.enrollments for select to authenticated
using (user_id=(select auth.uid()) or (select private.is_staff()));
-- Escrita em enrollments: SOMENTE serviço confiável após pagamento/autorizações.
create policy lessons_read on public.lessons for select to authenticated
using ((published and (select private.has_course_access(course_id))) or (select private.is_staff()));
create policy lessons_staff_manage on public.lessons for all to authenticated using ((select private.is_staff())) with check ((select private.is_staff()));
create policy materials_read on public.materials for select to authenticated using (
  (select private.is_staff()) or exists (select 1 from public.lessons l
    where l.id=lesson_id and l.published and (select private.has_course_access(l.course_id)))
);
create policy materials_staff_manage on public.materials for all to authenticated using ((select private.is_staff())) with check ((select private.is_staff()));
create policy progress_read on public.lesson_progress for select to authenticated
using (user_id=(select auth.uid()) or (select private.is_staff()));
create policy progress_create on public.lesson_progress for insert to authenticated
with check (user_id=(select auth.uid()) and exists (select 1 from public.lessons l
 where l.id=lesson_id and l.published and (select private.has_course_access(l.course_id))));
create policy progress_delete on public.lesson_progress for delete to authenticated
using (user_id=(select auth.uid()));
create policy task_select on public.study_tasks for select to authenticated using (user_id=(select auth.uid()));
create policy task_insert on public.study_tasks for insert to authenticated with check (user_id=(select auth.uid()));
create policy task_update on public.study_tasks for update to authenticated
using (user_id=(select auth.uid())) with check (user_id=(select auth.uid()));
create policy task_delete on public.study_tasks for delete to authenticated using (user_id=(select auth.uid()));
create policy assignments_read on public.assignments for select to authenticated
using ((published and (select private.has_course_access(course_id))) or (select private.is_staff()));
create policy assignments_manage on public.assignments for all to authenticated using ((select private.is_staff())) with check ((select private.is_staff()));
create policy submissions_read on public.submissions for select to authenticated
using (user_id=(select auth.uid()) or (select private.is_staff()));
create policy submissions_create on public.submissions for insert to authenticated
with check (user_id=(select auth.uid()) and status='submitted' and score is null and feedback is null
  and competencies is null and exists (select 1 from public.assignments a where a.id=assignment_id
    and a.published and (a.due_at is null or a.due_at>now())
    and (select private.has_course_access(a.course_id))));
create policy submissions_staff_update on public.submissions for update to authenticated
using ((select private.is_staff())) with check ((select private.is_staff()));

-- Criação segura do perfil após signup, mantendo PAPÉIS fora do perfil.
create or replace function private.on_auth_user_created()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id,display_name)
  values (new.id,coalesce(nullif(left(new.raw_user_meta_data->>'display_name',80),''),'Estudante'));
  return new;
end;
$$;
revoke all on function private.on_auth_user_created() from public, anon, authenticated;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute function private.on_auth_user_created();

-- Armazenamento de materiais deve usar bucket PRIVADO + políticas em storage.objects.
-- Ainda NÃO há aqui política de upload ou assinatura de URLs, nem gateway de vídeo.
-- Adicione só após o modelo de armazenamento e o fluxo de download estarem implementados.
