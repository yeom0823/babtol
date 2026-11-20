import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { Output, generateText, type ModelMessage } from "ai";

import { ollamaConfig, withFallback, type OllamaConfig } from "@/lib/model-router";

/**
 * 기본은 AI Gateway의 무료 텍스트 모델이다. 유료 크레딧을 충전했으면 AI_MODEL 환경 변수로
 * 유료 모델(예: anthropic/claude-haiku-5.5)을 지정한다. 무료 모델은 팀 전체 분당 5회 한도가 있다.
 * 모델 ID와 가격은 작업할 때 모델 목록(https://ai-gateway.vercel.sh/v1/models)에서 다시 확인한다.
 */
export const MODEL_ID = process.env.AI_MODEL?.trim() || "nvidia/nemotron-3.5-lightning-free";

/** 시스템 지시와 요청(필요하면 사진)을 받아 모델 답의 JSON을 돌려준다. 테스트에서는 가짜로 바꿔 끼운다. */
export type JsonModel = (prompt: {
  system: string;
  user: string;
  timeoutMs?: number;
  images?: Uint8Array[];
}) => Promise<unknown>;

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

function messagesOf(user: string, images?: Uint8Array[]): ModelMessage[] {
  if (!images?.length) return [{ role: "user", content: user }];
  return [
    {
      role: "user",
      content: [
        { type: "text", text: user },
        ...images.map((data) => ({ type: "file" as const, mediaType: "image", data })),
      ],
    },
  ];
}

/**
 * AI Gateway 모델. JSON 모드(Output.json)로 받아서 형식이 깨진 답이 거의 없다. 구조는 호출한 쪽이
 * zod로 검증한다. 무료 모델은 기본값으로 추론 글을 2~3만 자 써서 한 번에 40초 넘게 걸리므로 추론을
 * 끈다(2~6초). SDK 재시도는 끈다. 호출 한도가 분당 5회라 SDK가 다시 보내면 한도만 빨리 닳는다.
 * 인증은 Vercel OIDC 토큰이 맡는다.
 */
const cloudModel: JsonModel = async ({ system, user, timeoutMs = 20_000, images }) => {
  try {
    const { output } = await generateText({
      model: MODEL_ID,
      system,
      messages: messagesOf(user, images),
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

/**
 * 자체 호스팅 Ollama 모델(OpenAI 호환 API). 공식 @ai-sdk/openai-compatible로 붙인다.
 * 로컬 모델은 클라우드보다 느려서, 부른 쪽이 정한 시간과 OLLAMA_TIMEOUT_MS 가운데 긴 쪽을 기다린다.
 * 생각(추론) 단계가 없는 모델(예: exaone3.5, qwen2.5)을 권한다.
 */
function ollamaModel(config: OllamaConfig, modelId: string): JsonModel {
  const provider = createOpenAICompatible({
    name: "ollama",
    baseURL: config.baseURL,
    headers: config.headers,
  });
  return async ({ system, user, timeoutMs = 0, images }) => {
    const { output } = await generateText({
      model: provider(modelId),
      system,
      messages: messagesOf(user, images),
      output: Output.json(),
      abortSignal: AbortSignal.timeout(Math.max(timeoutMs, config.timeoutMs)),
      maxRetries: 0,
    });
    return output;
  };
}

const ollama = ollamaConfig(process.env);

/**
 * 앱 전체가 쓰는 기본 모델. 자체 호스팅 Ollama가 설정되어 있으면 그것을 먼저 쓰고, 꺼져 있거나 실패하면
 * 같은 요청을 AI Gateway 모델로 넘긴다. 설정이 없으면 AI Gateway만 쓴다.
 */
export const gatewayModel: JsonModel = ollama
  ? withFallback(ollamaModel(ollama, ollama.model), cloudModel)
  : cloudModel;

/**
 * 사진을 직접 읽는 비전 모델(자체 호스팅 Ollama의 OLLAMA_VISION_MODEL). 설정이 없으면 null이라
 * 식단표 사진은 OCR로 글자를 먼저 뽑는다.
 */
export const visionModel: JsonModel | null =
  ollama?.visionModel ? ollamaModel(ollama, ollama.visionModel) : null;
