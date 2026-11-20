import { expect, test } from "vitest";

import { ollamaConfig, withFallback } from "@/lib/model-router";
import type { JsonModel } from "@/lib/llm";

test("OLLAMA_BASE_URL이 없으면 집 PC 모델을 쓰지 않는다", () => {
  expect(ollamaConfig({})).toBeNull();
});

test("집 PC 모델 설정을 환경 변수에서 읽는다", () => {
  const c = ollamaConfig({
    OLLAMA_BASE_URL: "https://ollama.example.com/v1/",
    OLLAMA_MODEL: "exaone3.5:7.8b",
    OLLAMA_VISION_MODEL: "qwen2.5vl:7b",
    OLLAMA_TIMEOUT_MS: "60000",
    OLLAMA_CF_ACCESS_CLIENT_ID: "id.access",
    OLLAMA_CF_ACCESS_CLIENT_SECRET: "secret",
  });
  expect(c).toEqual({
    baseURL: "https://ollama.example.com/v1",
    model: "exaone3.5:7.8b",
    visionModel: "qwen2.5vl:7b",
    timeoutMs: 60000,
    headers: { "CF-Access-Client-Id": "id.access", "CF-Access-Client-Secret": "secret" },
  });
});

test("모델 이름과 기다리는 시간을 안 정하면 기본값을 쓴다", () => {
  const c = ollamaConfig({ OLLAMA_BASE_URL: "http://localhost:11434/v1" })!;
  expect(c.model).toBe("exaone3.5:7.8b");
  expect(c.visionModel).toBeNull();
  expect(c.timeoutMs).toBe(90_000);
  expect(c.headers).toEqual({});
});

const ok = (v: unknown): JsonModel => async () => v;
const fail: JsonModel = async () => {
  throw new Error("집 PC 꺼짐");
};

test("집 PC 모델이 답하면 그 답을 쓰고 대신 모델은 부르지 않는다", async () => {
  let fallbackCalls = 0;
  const model = withFallback(ok({ from: "ollama" }), async () => {
    fallbackCalls++;
    return { from: "gateway" };
  });
  expect(await model({ system: "s", user: "u" })).toEqual({ from: "ollama" });
  expect(fallbackCalls).toBe(0);
});

test("집 PC 모델이 실패하면 같은 요청을 대신 모델로 넘긴다", async () => {
  let seen: unknown = null;
  const model = withFallback(fail, async (p) => {
    seen = p;
    return { from: "gateway" };
  });
  expect(await model({ system: "s", user: "u", timeoutMs: 12_000 })).toEqual({ from: "gateway" });
  expect(seen).toEqual({ system: "s", user: "u", timeoutMs: 12_000 });
});

test("실패한 뒤 잠시 동안은 집 PC를 건너뛰고, 시간이 지나면 다시 시도한다", async () => {
  let now = 0;
  let primaryCalls = 0;
  const primary: JsonModel = async () => {
    primaryCalls++;
    throw new Error("꺼짐");
  };
  const model = withFallback(primary, ok("gateway"), { cooldownMs: 180_000, now: () => now });
  await model({ system: "s", user: "u" });
  now = 60_000;
  await model({ system: "s", user: "u" });
  expect(primaryCalls).toBe(1);
  now = 200_000;
  await model({ system: "s", user: "u" });
  expect(primaryCalls).toBe(2);
});
