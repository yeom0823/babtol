# 다른 환경에서 이어서 작업하기

새 컴퓨터나 다른 개발 환경에서 밥톨 작업을 이어 갈 때 필요한 준비, 지금 구조, 남은 일을 모았다.
값(키, 토큰, 비밀번호)은 이 문서에 적지 않는다. 저장소가 공개라서 변수 이름만 적는다.

## 1. 개발 환경 준비

1. 저장소를 받고 의존성을 설치한다.
   ```
   git clone https://github.com/yeom0823/babtol.git
   cd babtol
   bun install
   ```
2. git 작성자를 저장소에 지정한다(회사·개인 기본 계정이 커밋에 섞이지 않게).
   ```
   git config user.name yeom0823
   git config user.email 77563714+yeom0823@users.noreply.github.com
   ```
3. Vercel 프로젝트에 연결하고 환경 변수를 내려받는다. AI Gateway 인증(`VERCEL_OIDC_TOKEN`)도 함께 내려온다.
   이 토큰은 12시간쯤 지나면 만료되니, AI 호출이 401로 실패하면 다시 내려받는다.
   ```
   bunx vercel link --project babtol
   bunx vercel env pull .env.local
   ```
4. Supabase CLI에 로그인하고 프로젝트에 연결한다(로그인은 브라우저에서 직접).
   ```
   bunx supabase login
   bunx supabase link --project-ref twcpoywwakxmfkjrtqxy
   ```
5. 개발 서버는 3100번 포트로 띄운다(`.claude/launch.json`의 `home-meal`).
   ```
   bun run dev -p 3100
   ```
6. 확인 명령: `bun run typecheck`, `bun run lint`, `bun run test`.

### 환경 변수

| 이름 | 쓰는 곳 | 비고 |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | 로그인(브라우저·서버) | 공개 값 |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | 로그인(브라우저·서버) | 공개 키(`sb_publishable_`) |
| `SUPABASE_URL` | 서버 저장소·가족 표 | |
| `SUPABASE_SECRET_KEY` | 서버 저장소·가족 표 | 비밀. `NEXT_PUBLIC_`을 붙이지 않는다 |
| `FOODSAFETY_API_KEY` | 메뉴 사진(식약처 레시피 DB) | 없으면 사진 없이 동작 |
| `AI_MODEL` | AI Gateway 모델 ID | 없으면 무료 모델 |
| `OLLAMA_BASE_URL` 외 `OLLAMA_*` | 자체 호스팅 모델 | [self-hosted-ollama.md](self-hosted-ollama.md) |
| `HOME_MEAL_DATA_FILE`, `HOME_MEAL_DATA_DIR` | 테스트·로컬 파일 저장 | 보통 비워 둔다 |

로그인 관련 두 값(`NEXT_PUBLIC_SUPABASE_*`)이 없으면 로그인 기능만 꺼지고, 저장소는 `legacy` 범위 하나를 쓴다.

### 외부 서비스 설정 위치

- **Supabase** (프로젝트 `babtol`, 서울): Authentication → Sign In / Providers → Google, URL Configuration
  (Site URL `https://babtol.vercel.app`, Redirect URLs `https://babtol.vercel.app/**`, `http://localhost:3100/**`).
- **Google Cloud** (Google Auth Platform): OAuth 클라이언트의 JavaScript 원본과 리디렉션 URI
  (`https://twcpoywwakxmfkjrtqxy.supabase.co/auth/v1/callback`). Audience가 테스트 중이면 사용자를 테스트 사용자로 추가해야 로그인된다.
- **Vercel** (프로젝트 `babtol`): 환경 변수, 함수 지역은 `vercel.json`의 `icn1`(서울).

## 2. 지금 구조에서 알아 둘 것

- **로컬과 운영이 같은 Supabase를 쓴다.** 로컬에서 누른 반응, 만든 추천, 키즈노트 연결이 운영 데이터에 그대로 남는다.
  테스트로 바꾼 값은 되돌리고, AI 테스트는 미래 날짜로 한다.
- **데이터는 가족 단위다.** `app_store(scope, key, value)`의 `scope`가 가족 ID다. 메뉴 사진 캐시(`dishPhotos*`)만 `global`이다.
  서버는 로그인 사용자를 확인해 가족을 찾고(`lib/current-family.ts`), 그 범위로만 읽고 쓴다(`lib/local-store.ts`).
- **가족·초대·아이 표**(`families`, `family_members`, `family_invites`, `children`)와 `app_store`는 RLS를 켜고 anon·authenticated 권한을 뺐다.
  서버의 비밀 키 클라이언트(`lib/supabase/admin.ts`)로만 다룬다. `profiles`만 로그인 사용자가 자기 행을 RLS로 읽고 이름만 고친다.
- **로그인**: Google 한 가지. `proxy.ts`가 세션을 갱신하고 `/auth/*` 밖의 모든 주소를 로그인으로 보낸다.
  가족이 없으면 `(tabs)`, `(sub)` 레이아웃이 `/family/start`로 보낸다.
- **마이그레이션 순서**: 저장 방식이 바뀌는 마이그레이션은 운영에 적용한 순간부터 배포된 옛 코드가 깨질 수 있다.
  새 코드를 다 만든 뒤 `bunx supabase db push --remote`로 적용하고 곧바로 푸시·배포한다.
- **AI 호출**: `lib/llm.ts`. `OLLAMA_BASE_URL`이 있으면 Ollama를 먼저 쓰고, 실패하면 AI Gateway로 넘어간 뒤 3분 동안 Ollama를 건너뛴다.
- **키즈노트**: 화면을 열 때 1시간에 한 번, "새로 가져오기" 버튼은 5분에 한 번까지만 부른다. 공개 API가 아니어서 요청을 늘리지 않는다.

## 3. 남은 일

### 바로 할 일
- [ ] 자체 호스팅 Ollama 연결: [self-hosted-ollama.md](self-hosted-ollama.md)대로 서버·터널·Access를 만들고 Vercel에 `OLLAMA_*`를 넣는다.
  Cloudflare Tunnel은 Cloudflare에 연결된 도메인이 필요하다. 도메인이 없으면 다른 터널 방식으로 가이드를 바꾼다.
- [ ] AI가 응답하면 확인: 추천 만들기, 이것만 바꾸기, 다른 한 상, 식품군 채우기. 아이 개월 수와 알레르기가 추천에 반영되는지 본다.
- [ ] 잘못 만들어진 추천 정리: 11월 20일 저녁의 "배", "배 변"(모델이 만든 가짜 메뉴)은 "다른 한 상"으로 다시 고른다.
- [ ] 쓰지 않는 저장 키 정리: `global` 범위의 `dishPhotos`, `dishPhotos:v2`(지금은 `dishPhotos:v3`만 쓴다).
- [ ] Google OAuth Audience를 테스트에서 운영으로 바꿀지 정한다(테스트 사용자 100명 제한, 7일마다 재로그인).

### 정해야 할 것
- 유료 모델로 바꿀 때: Vercel `AI_MODEL`만 바꾸면 된다. 모델 ID와 가격은 AI Gateway 모델 목록에서 확인한다.
- 잘 먹은 메뉴가 처음에는 비어 있는 문제: 먹은 뒤 표정을 누르라는 안내를 오늘 화면에 한 번 띄울지.

### 기능 후보
- 장보기에서 여러 번 쓰는 재료의 분량 합치기(지금은 "2번 써요"만 보임).
- 키즈노트 알림장·앨범 사진 가져오기(지금은 식단 사진 3장만).
- 주간 식단 한눈에 보기.
- 아이가 여럿일 때 아이별 추천 나누기(지금은 가장 어린 아이 기준으로 한 번 추천).

### 기록된 후속 과제
- [docs/follow-ups/](../follow-ups/) 참고: 존재하지 않는 날짜 주소 처리, LLM 품질 eval 미작성.
- `docs/specs/home-meal-recommendation/`은 처음 스펙이다. 로그인·가족·아이 정보가 생기면서 일부 내용("로그인 없음", 나이 고정)이 지금과 다르다.
