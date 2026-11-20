-- 가족 단위 공유: 가족, 구성원, 초대 링크, 아이 정보.
-- app_store처럼 서버만 비밀 키(service_role)로 읽고 쓴다. 서버가 로그인 사용자를 확인한 뒤
-- 그 사람이 속한 가족의 행만 다룬다. RLS를 켜고 anon·authenticated 권한은 회수한다.

create table public.families (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

-- 한 사람은 한 가족에만 속한다.
create table public.family_members (
  family_id uuid not null references public.families (id) on delete cascade,
  user_id uuid not null unique references auth.users (id) on delete cascade,
  role text not null check (role in ('owner', 'member')),
  joined_at timestamptz not null default now(),
  primary key (family_id, user_id)
);

-- 초대 링크. 만료 전까지 여러 사람이 쓸 수 있다.
create table public.family_invites (
  code text primary key,
  family_id uuid not null references public.families (id) on delete cascade,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);
create index family_invites_family_id_idx on public.family_invites (family_id);
create index family_invites_created_by_idx on public.family_invites (created_by);

create table public.children (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  name text not null,
  birth_month date,
  allergies text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index children_family_id_idx on public.children (family_id);

alter table public.families enable row level security;
alter table public.family_members enable row level security;
alter table public.family_invites enable row level security;
alter table public.children enable row level security;

revoke all on public.families, public.family_members, public.family_invites, public.children from anon, authenticated;
grant select, insert, update, delete on public.families, public.family_members, public.family_invites, public.children to service_role;

-- 저장소를 가족별로 나눈다. 지금까지의 행은 legacy로 두었다가 첫 가족이 생길 때 그 가족 것으로 옮긴다.
-- 메뉴 사진 캐시처럼 모두가 같이 써도 되는 값은 global에 둔다.
alter table public.app_store add column scope text not null default 'legacy';
alter table public.app_store drop constraint app_store_pkey;
alter table public.app_store add primary key (scope, key);
update public.app_store set scope = 'global' where key like 'dishPhotos%';
