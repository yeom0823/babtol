import { generateText } from "ai";

import { extractJson } from "@/lib/extract-json";

/** AI Gateway의 무료 텍스트 모델. 모델 ID와 무료 여부는 작업할 때 모델 목록에서 다시 확인한다. */
export const MODEL_ID = "nvidia/nemotron-3.5-lightning-free";

/** 시스템 지시와 요청을 받아 모델 답의 JSON을 돌려준다. 테스트에서는 가짜로 바꿔 끼운다. */
export type JsonModel = (prompt: { system: string; user: string }) => Promise<unknown>;

/**
 * 무료 모델은 게이트웨이가 JSON 스키마를 강제하지 않는다(responseFormat 미지원). 그래서 프롬프트의
 * 예시로 형식을 알려 주고, 답에서 JSON을 꺼내 호출한 쪽이 직접 검증한다. 인증은 Vercel OIDC 토큰이 맡는다.
 */
export const gatewayModel: JsonModel = async ({ system, user }) => {
  const { text } = await generateText({
    model: MODEL_ID,
    system,
    prompt: user,
    // 이 모델은 기본값으로 추론 글을 2~3만 자 써서 한 번에 40초 넘게 걸린다(끼니 바꾸기 한 번에 최대 2.7분).
    // 추론을 끄면 2초 안팎에 같은 형식으로 답한다. 규칙은 코드가 검사하고 어기면 다시 받는다.
    reasoning: "none",
    abortSignal: AbortSignal.timeout(170_000),
    maxRetries: 1,
  });
  return extractJson(text);
};
