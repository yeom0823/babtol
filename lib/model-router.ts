import type { JsonModel } from "@/lib/llm";

/**
 * 자체 호스팅 Ollama 모델 설정. OLLAMA_BASE_URL이 있을 때만 쓴다.
 * Ollama에는 로그인이 없어 인터넷에 열 때는 Cloudflare Access 같은 문지기를 앞에 둔다.
 * 그 접근 토큰은 OLLAMA_CF_ACCESS_CLIENT_ID/SECRET로 받아 요청 헤더로만 보낸다.
 */
export type OllamaConfig = {
  baseURL: string;
  model: string;
  /** 사진을 직접 읽는 비전 모델. 없으면 식단표 사진은 지금처럼 OCR로 읽는다. */
  visionModel: string | null;
  timeoutMs: number;
  headers: Record<string, string>;
};

/** 생각(추론) 단계가 없어 빠르고 한국어에 강한 모델. 메모리 16GB 기기에서 돌릴 수 있는 크기다. */
const DEFAULT_MODEL = "exaone3.5:7.8b";
/** 로컬 모델은 클라우드보다 느려서 넉넉히 기다린다. */
const DEFAULT_TIMEOUT_MS = 90_000;

export function ollamaConfig(env: Record<string, string | undefined>): OllamaConfig | null {
  const baseURL = env.OLLAMA_BASE_URL?.trim().replace(/\/+$/, "");
  if (!baseURL) return null;
  const headers: Record<string, string> = {};
  if (env.OLLAMA_CF_ACCESS_CLIENT_ID && env.OLLAMA_CF_ACCESS_CLIENT_SECRET) {
    headers["CF-Access-Client-Id"] = env.OLLAMA_CF_ACCESS_CLIENT_ID;
    headers["CF-Access-Client-Secret"] = env.OLLAMA_CF_ACCESS_CLIENT_SECRET;
  }
  const timeout = Number(env.OLLAMA_TIMEOUT_MS);
  return {
    baseURL,
    model: env.OLLAMA_MODEL?.trim() || DEFAULT_MODEL,
    visionModel: env.OLLAMA_VISION_MODEL?.trim() || null,
    timeoutMs: Number.isFinite(timeout) && timeout > 0 ? timeout : DEFAULT_TIMEOUT_MS,
    headers,
  };
}

/**
 * 먼저 primary(자체 호스팅 서버)를 부르고, 실패하면 같은 요청을 fallback(무료 게이트웨이)으로 넘긴다.
 * 실패한 뒤 cooldownMs 동안은 primary를 건너뛰어, 서버가 꺼져 있을 때 매번 기다리지 않게 한다.
 */
export function withFallback(
  primary: JsonModel,
  fallback: JsonModel,
  { cooldownMs = 180_000, now = Date.now }: { cooldownMs?: number; now?: () => number } = {}
): JsonModel {
  let downUntil = 0;
  return async (prompt) => {
    if (now() >= downUntil) {
      try {
        return await primary(prompt);
      } catch (e) {
        downUntil = now() + cooldownMs;
        console.info("[model] 자체 호스팅 모델 실패, 대신 모델로 넘김:", e instanceof Error ? e.message : e);
      }
    }
    return fallback(prompt);
  };
}
