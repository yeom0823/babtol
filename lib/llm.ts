import { Output, generateText } from "ai";

/** AI Gateway의 무료 텍스트 모델. 모델 ID와 무료 여부는 작업할 때 모델 목록에서 다시 확인한다. */
export const MODEL_ID = "nvidia/nemotron-3.5-lightning-free";

/** 시스템 지시와 요청을 받아 모델 답의 JSON을 돌려준다. 테스트에서는 가짜로 바꿔 끼운다. */
export type JsonModel = (prompt: { system: string; user: string; timeoutMs?: number }) => Promise<unknown>;

/**
 * 무료 모델의 호출 한도(팀 전체 분당 5회)에 걸렸다. 1분 안에 다시 불러도 같은 답이라
 * 부른 쪽은 재시도를 멈추고 잠시 뒤에 다시 하라고 알린다.
 */
export class ModelBusyError extends Error {}

function isRateLimit(e: unknown): boolean {
  const err = e as { name?: string; message?: string; statusCode?: number; lastError?: unknown };
  if (!err) return false;
  if (err.statusCode === 429 || /RateLimit/i.test(err.name ?? "") || /rate limit/i.test(err.message ?? "")) return true;
  return err.lastError ? isRateLimit(err.lastError) : false;
}

/**
 * JSON 모드(Output.json)로 받아서 형식이 깨진 답이 거의 없다. 구조는 호출한 쪽이 zod로 검증한다.
 * 이 모델은 기본값으로 추론 글을 2~3만 자 써서 한 번에 40초 넘게 걸리므로 추론을 끈다(2~6초).
 * SDK 재시도는 끈다. 호출 한도가 분당 5회라 SDK가 다시 보내면 한도만 빨리 닳는다.
 * 인증은 Vercel OIDC 토큰이 맡는다.
 */
export const gatewayModel: JsonModel = async ({ system, user, timeoutMs = 20_000 }) => {
  try {
    const { output } = await generateText({
      model: MODEL_ID,
      system,
      prompt: user,
      output: Output.json(),
      reasoning: "none",
      // 끼니 추천의 정상 답은 길어야 8초쯤이다. 배포 환경에서 가끔 응답 없이 멈추는 호출이 있어
      // 기본 20초에 끊고 다시 받는다. 답이 긴 식단표 읽기는 더 길게 준다.
      abortSignal: AbortSignal.timeout(timeoutMs),
      maxRetries: 0,
    });
    return output;
  } catch (e) {
    if (isRateLimit(e)) throw new ModelBusyError("AI 호출 한도에 걸렸어요");
    throw e;
  }
};
