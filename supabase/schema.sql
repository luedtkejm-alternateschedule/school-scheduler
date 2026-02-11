create extension if not exists pgcrypto;

do $$ begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type user_role as enum ('ADMIN','TEACHER','STUDENT');
  end if;
  if not exists (select 1 from pg_type where typname = 'activity_type') then
    create type activity_type as enum ('ENRICHMENT','OFFICE_HOURS','STUDY_HALL','OTHER_SPACE','COMMUNITY');
  end if;
end $$;

create table if not exists app_users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  password_hash text not null,
  role user_role not null,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists teachers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique not null references app_users(id) on delete cascade
);

create table if not exists students (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique not null references app_users(id) on delete cascade,
  grade int not null,
  is_senior boolean not null default false
);

create table if not exists blocks (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  label text not null,
  sort_index int not null
);

create table if not exists activities (
  id uuid primary key default gen_random_uuid(),
  block_id uuid not null references blocks(id) on delete cascade,
  leader_teacher_id uuid references teachers(id) on delete set null,
  type activity_type not null,
  title text not null,
  capacity int not null check (capacity >= 0),
  open_for_overflow boolean not null default false,
  priority int not null default 100,
  created_at timestamptz not null default now()
);

create table if not exists student_signups (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  block_id uuid not null references blocks(id) on delete cascade,
  activity_id uuid not null references activities(id) on delete cascade,
  source text not null,
  created_at timestamptz not null default now(),
  unique(student_id, block_id)
);

create or replace function public.signup_student(p_student_id uuid, p_block_id uuid, p_activity_id uuid, p_source text)
returns void
language plpgsql
as $$
declare
  v_capacity int;
  v_count int;
begin
  if not exists (select 1 from activities a where a.id=p_activity_id and a.block_id=p_block_id) then
    raise exception 'Activity not in block';
  end if;

  select capacity into v_capacity from activities where id=p_activity_id for update;
  select count(*) into v_count from student_signups where activity_id=p_activity_id;

  if v_count >= v_capacity then
    raise exception 'Activity full';
  end if;

  insert into student_signups(student_id, block_id, activity_id, source)
  values (p_student_id, p_block_id, p_activity_id, p_source)
  on conflict (student_id, block_id) do update
    set activity_id=excluded.activity_id, source=excluded.source, created_at=now();
end $$;

-- seed admin user (admin12345)
insert into app_users(email,password_hash,role,name)
values ('admin@demo.local', '$2a$10$9fF0q4GZcT2gQ2zQkG4z0O8Y.5H3xZzC86xG5P9v8X3w7KsvRk9kS', 'ADMIN', 'Demo Admin')
on conflict (email) do nothing;
