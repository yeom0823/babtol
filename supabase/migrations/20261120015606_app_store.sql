-- 밥톨 앱 데이터 저장소.
-- 로컬 JSON 파일에 키별로 저장하던 값(어린이집 식단, 추천, 먹은 결과, 키즈노트 연결 등)을
-- 키-값 행으로 그대로 옮긴다. 배포 환경에서 서버가 바뀌거나 재배포돼도 데이터가 남게 한다.
--
-- 앱에는 로그인이 없어서 서버만 비밀 키(service_role)로 읽고 쓴다.
-- RLS를 켜고 정책을 만들지 않아 anon·authenticated는 행을 볼 수 없고, 표 권한도 회수한다.
create table public.app_store (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

comment on table public.app_store is '밥톨 앱 데이터(키별 JSON). 서버만 service_role로 접근한다.';

alter table public.app_store enable row level security;

revoke all on table public.app_store from anon, authenticated;
grant select, insert, update, delete on table public.app_store to service_role;
