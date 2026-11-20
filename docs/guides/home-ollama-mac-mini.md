# 집 맥미니의 Ollama를 밥톨에 연결하기

밥톨(Vercel 배포)이 집 맥미니에서 돌리는 Ollama 모델을 먼저 쓰고, 맥미니가 꺼져 있거나 응답하지 않으면 AI Gateway의 무료 모델로 자동으로 넘어가게 하는 설정입니다. 실패한 뒤 3분 동안은 맥미니를 건너뜁니다.

```
휴대폰 → Vercel(밥톨) → Cloudflare Tunnel(+ Access 토큰) → 맥미니 Ollama
                     ↘ 맥미니가 안 되면 → AI Gateway 무료 모델
```

> 모델 이름, 메뉴 위치, 명령어는 바뀔 수 있습니다. 설치할 때 각 공식 사이트(ollama.com, Cloudflare 문서)에서 다시 확인하세요. 맥미니 M4 16GB에서의 실제 속도는 아직 재 보지 않았습니다.

## 1. Ollama와 모델 (맥미니)

1. ollama.com에서 macOS용 Ollama를 설치합니다.
2. 모델을 받습니다. 메모리 16GB에서는 7~8B급이 맞습니다.
   ```bash
   ollama pull exaone3.5:7.8b     # 추천·레시피(한국어, 생각 단계 없음)
   ollama pull qwen2.5vl:7b       # 식단표 사진 읽기(선택)
   ```
   두 모델을 동시에 올리면 메모리가 빠듯할 수 있습니다. 사진 읽기가 필요 없으면 비전 모델은 받지 않아도 됩니다.
3. 모델이 내려가 다시 올라오는 시간을 줄이려면 오래 올려 두게 합니다(macOS 앱 기준).
   ```bash
   launchctl setenv OLLAMA_KEEP_ALIVE 24h
   ```
   설정 뒤 Ollama 앱을 다시 시작합니다.
4. 맥미니가 잠들지 않게 **시스템 설정 → 에너지**에서 자동 잠자기를 끕니다.
5. 확인: `curl http://localhost:11434/v1/models` 에 받은 모델이 보여야 합니다.

Ollama는 `localhost`에서만 듣게 그대로 둡니다. 바깥 연결은 다음 단계의 터널이 맡습니다.

## 2. Cloudflare Tunnel로 바깥에 열기

Cloudflare에 연결된 도메인이 하나 필요합니다.

1. Cloudflare 대시보드 → **Zero Trust → Networks → Tunnels**에서 터널을 만듭니다.
2. 안내대로 맥미니에 `cloudflared`를 설치하고 토큰으로 서비스를 등록합니다(재부팅해도 자동 실행).
3. **Public Hostname**을 추가합니다.
   - Hostname: 예) `ollama.내도메인`
   - Service: `http://localhost:11434`
   - Ollama가 다른 Host 헤더를 거절하면 **HTTP Host Header**를 `localhost:11434`로 지정합니다.

## 3. 앱만 들어오게 막기 (꼭 하세요)

Ollama에는 로그인이 없습니다. 이 단계를 건너뛰면 주소를 아는 누구나 맥미니를 씁니다.

1. **Zero Trust → Access → Service Auth**에서 **서비스 토큰**을 만듭니다. Client ID와 Client Secret이 한 번 나옵니다.
2. **Access → Applications**에서 Self-hosted 앱을 만들고 도메인을 `ollama.내도메인`으로 둡니다.
3. 정책의 동작을 **Service Auth**로 하고, 방금 만든 서비스 토큰만 허용합니다.
4. 확인: 토큰 없이 `https://ollama.내도메인/v1/models`를 열면 막혀야 하고, 헤더를 붙이면 열려야 합니다.
   ```bash
   curl https://ollama.내도메인/v1/models \
     -H "CF-Access-Client-Id: <Client ID>" \
     -H "CF-Access-Client-Secret: <Client Secret>"
   ```

## 4. Vercel 환경 변수 (babtol 프로젝트)

| 이름 | 값 | 필수 |
|---|---|---|
| `OLLAMA_BASE_URL` | `https://ollama.내도메인/v1` | 예 |
| `OLLAMA_CF_ACCESS_CLIENT_ID` | 서비스 토큰 Client ID | 예 |
| `OLLAMA_CF_ACCESS_CLIENT_SECRET` | 서비스 토큰 Client Secret | 예 |
| `OLLAMA_MODEL` | 기본 `exaone3.5:7.8b` | 아니요 |
| `OLLAMA_VISION_MODEL` | 예) `qwen2.5vl:7b`. 없으면 사진은 OCR로 읽음 | 아니요 |
| `OLLAMA_TIMEOUT_MS` | 기본 `90000`(90초) | 아니요 |

이름에 `NEXT_PUBLIC_`을 붙이지 마세요. 넣은 뒤 **Redeploy**해야 적용됩니다.

## 동작 방식

- 모든 추천·레시피·식단표 정리는 맥미니 모델을 먼저 부르고, 실패하면 같은 요청을 AI Gateway 모델로 보냅니다(`lib/llm.ts`, `lib/model-router.ts`).
- 비전 모델이 있으면 식단표 사진은 맥미니가 직접 보고, 실패하거나 아무것도 못 읽으면 OCR로 넘어갑니다(`app/api/menu-reading/route.ts`).
- 로컬 모델은 첫 응답이 느릴 수 있어 부른 쪽의 제한 시간과 `OLLAMA_TIMEOUT_MS` 가운데 긴 쪽을 기다립니다. Vercel 함수의 최대 실행 시간보다 길게 잡지 마세요.
