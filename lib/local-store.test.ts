import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, expect, test } from "vitest";

import { readStore, updateStore } from "@/lib/local-store";

let dir: string;
beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), "meal-store-"));
  process.env.HOME_MEAL_DATA_FILE = join(dir, "data.json");
});
afterEach(async () => {
  delete process.env.HOME_MEAL_DATA_FILE;
  await rm(dir, { recursive: true, force: true });
});

test("저장한 적 없는 키는 기본값을 준다", async () => {
  expect(await readStore("avoid", ["기본"])).toEqual(["기본"]);
});

test("저장한 값은 다시 읽으면 그대로 나온다", async () => {
  await updateStore("avoid", [] as string[], (list) => [...list, "땅콩"]);
  expect(await readStore("avoid", [] as string[])).toEqual(["땅콩"]);
});

test("동시에 고쳐도 서로의 변경을 덮어쓰지 않는다", async () => {
  await Promise.all(
    ["a", "b", "c", "d", "e"].map((x) =>
      updateStore("avoid", [] as string[], (list) => [...list, x])
    )
  );
  const saved = await readStore("avoid", [] as string[]);
  expect([...saved].sort()).toEqual(["a", "b", "c", "d", "e"]);
});

test("서로 다른 키는 한 파일에 함께 저장된다", async () => {
  await updateStore("avoid", [] as string[], () => ["새우"]);
  await updateStore("plans", {} as Record<string, number>, () => ({ x: 1 }));
  const raw = JSON.parse(await readFile(process.env.HOME_MEAL_DATA_FILE!, "utf8"));
  expect(raw).toEqual({ avoid: ["새우"], plans: { x: 1 } });
});

test("Supabase 접속 정보가 있으면 파일이 아니라 Supabase app_store에 저장한다", async () => {
  delete process.env.HOME_MEAL_DATA_FILE;
  process.env.SUPABASE_URL = "https://demo.supabase.co";
  process.env.SUPABASE_SECRET_KEY = "sb_secret_test";
  const rows = new Map<string, unknown>();
  const urls: string[] = [];
  const original = globalThis.fetch;
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(input instanceof Request ? input.url : String(input));
    urls.push(url.pathname);
    if ((init?.method ?? "GET") === "GET") {
      const key = url.searchParams.get("key")?.replace(/^eq\./, "") ?? "";
      return new Response(JSON.stringify(rows.has(key) ? [{ value: rows.get(key) }] : []), {
        headers: { "content-type": "application/json" },
      });
    }
    const row = JSON.parse(String(init?.body));
    rows.set(row.key, row.value);
    return new Response(null, { status: 201 });
  }) as typeof fetch;
  try {
    await updateStore("avoid", [] as string[], (list) => [...list, "메밀"]);
    expect(await readStore("avoid", [] as string[])).toEqual(["메밀"]);
    expect(rows.get("avoid")).toEqual(["메밀"]);
    expect(urls.every((u) => u === "/rest/v1/app_store")).toBe(true);
  } finally {
    globalThis.fetch = original;
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SECRET_KEY;
  }
});
