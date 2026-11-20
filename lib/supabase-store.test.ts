import { expect, test } from "vitest";

import { createSupabaseStore } from "@/lib/supabase-store";

/** app_store 표 하나를 흉내 내는 아주 작은 PostgREST. 요청도 기록한다. */
function fakePostgrest() {
  const rows = new Map<string, unknown>();
  const requests: { method: string; url: URL; apikey: string | null; prefer: string | null }[] = [];
  const f = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(input instanceof Request ? input.url : String(input));
    const headers = new Headers(init?.headers ?? (input instanceof Request ? input.headers : undefined));
    const method = init?.method ?? "GET";
    requests.push({ method, url, apikey: headers.get("apikey"), prefer: headers.get("prefer") });
    if (method === "GET") {
      const key = url.searchParams.get("key")?.replace(/^eq\./, "") ?? "";
      const body = rows.has(key) ? [{ value: rows.get(key) }] : [];
      return new Response(JSON.stringify(body), { status: 200, headers: { "content-type": "application/json" } });
    }
    const payload = JSON.parse(String(init?.body));
    for (const row of Array.isArray(payload) ? payload : [payload]) rows.set(row.key, row.value);
    return new Response(null, { status: 201 });
  }) as typeof fetch;
  return { f, rows, requests };
}

const config = (f: typeof fetch) => ({ url: "https://demo.supabase.co", secretKey: "sb_secret_test", fetch: f });

test("저장한 적 없는 키는 없음(undefined)이다", async () => {
  const { f } = fakePostgrest();
  expect(await createSupabaseStore(config(f)).read("avoidFoods")).toBeUndefined();
});

test("쓴 값은 다시 읽으면 그대로 나온다", async () => {
  const { f, rows } = fakePostgrest();
  const store = createSupabaseStore(config(f));
  await store.write("avoidFoods", ["땅콩", "새우"]);
  expect(rows.get("avoidFoods")).toEqual(["땅콩", "새우"]);
  expect(await store.read("avoidFoods")).toEqual(["땅콩", "새우"]);
});

test("app_store 표에 서버 비밀 키로, 같은 키는 덮어쓰기(upsert)로 저장한다", async () => {
  const { f, requests } = fakePostgrest();
  await createSupabaseStore(config(f)).write("dayPlans", { "2026-11-20": {} });
  const post = requests.find((r) => r.method === "POST")!;
  expect(post.url.pathname).toBe("/rest/v1/app_store");
  expect(post.url.searchParams.get("on_conflict")).toBe("key");
  expect(post.prefer).toContain("resolution=merge-duplicates");
  expect(post.apikey).toBe("sb_secret_test");
});
