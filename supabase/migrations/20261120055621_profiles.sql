-- 로그인한 사람의 프로필. Supabase User Management의 profiles 패턴을 따른다.
-- 이메일은 가입할 때 한 번만 복사하고(이메일 변경 경로가 없다), 이름만 직접 고칠 수 있다.

create schema if not exists private;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- 자기 프로필만 읽고 고친다. 행은 아래 트리거가 만들고, 지우기는 auth.users 삭제를 따른다.
revoke all on public.profiles from anon, authenticated;
grant select, update (display_name) on public.profiles to authenticated;

create policy "profiles: 자기 프로필 읽기" on public.profiles
  for select to authenticated
  using ((select auth.uid()) = id);

create policy "profiles: 자기 프로필 고치기" on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- 고칠 때마다 DB가 updated_at을 앞으로 옮기고 created_at은 그대로 둔다.
create function private.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  new.created_at := old.created_at;
  return new;
end;
$$;

create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function private.touch_updated_at();

-- 새 사용자가 생기면 프로필을 만든다. Google 이름이 있으면 처음 이름으로 쓴다.
create function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  stamp timestamptz := now();
begin
  insert into public.profiles (id, email, display_name, created_at, updated_at)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    stamp,
    stamp
  );
  return new;
end;
$$;

revoke execute on function private.handle_new_user() from public, anon, authenticated;
revoke execute on function private.touch_updated_at() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();
