# 키즈노트 로그인·2단계 인증 요청 형식이 실제 계정으로 검증되지 않음

**Symptom**: 키즈노트 연결(AC1, AC2, AC3)이 실제 서비스와 맞는지 모른다. 가짜 `fetch`로만 검증했다.

**Observed evidence**: 2026-11-19, 구현 중 로그인 페이지 형식과 인증 동작을 로그인 없이 확인하려던 호출이 권한 분류기에 막혀 확인하지 못했다. 스펙에는 엔드포인트 경로만 있고 본문 형식이 없다. 가정한 것: `POST /web/login/`은 `username`·`password` 폼, 2단계 인증 응답은 `enabled`·`phone` 필드, 센터 ID는 `/v1/me/info/`나 `/v1/children/` 응답 어딘가의 `center_id` 또는 `center.id`.

**Suspected cause**: 비공식 내부 API라 문서가 없다. 로그인에 CSRF 토큰이나 다른 필드가 필요할 수 있다.

**What was tried**: `features/kidsnote/client.ts`에 가정을 주석으로 적고, 형식이 다르면 연결 실패 화면과 식단표 올리기가 대체 경로가 되게 했다.

**Proposed next step**: 사용자가 브라우저에서 `/settings/kidsnote`로 직접 한 번 연결해 본다. 실패하면 키즈노트 웹의 로그인 요청을 개발자 도구로 보고 `client.ts`의 요청 본문과 응답 필드를 맞춘다. 약관의 자동 수집 허용 여부도 아직 확인하지 않았다.
