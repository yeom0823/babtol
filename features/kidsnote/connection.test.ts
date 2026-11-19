import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, expect, test } from "vitest";

import { connectionStatus, connectWithPassword, markExpired } from "./connection";

let dir: string;
beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), "kn-conn-"));
  process.env.HOME_MEAL_DATA_FILE = join(dir, "data.json");
});
afterEach(async () => {
  delete process.env.HOME_MEAL_DATA_FILE;
  await rm(dir, { recursive: true, force: true });
});

const PASSWORD = "S3cret-pw-!@#-9921";
const fakeKidsnote = (async (url: RequestInfo | URL) => {
  const u = String(url);
  if (u.includes("/v1/second-factors/")) return new Response(JSON.stringify({ enabled: false }), { status: 200 });
  if (u.includes("/web/login/"))
    return new Response("{}", { status: 200, headers: [["set-cookie", "sessionid=abc; Path=/"]] });
  if (u.includes("/v1/me/info/"))
    return new Response(JSON.stringify({ center: { id: 4242 } }), { status: 200 });
  return new Response("{}", { status: 404 });
}) as typeof fetch;

test("연결 전에는 연결 안 함 상태다", async () => {
  expect(await connectionStatus()).toBe("none");
});

test("아이디와 비밀번호로 연결하면 연결됨 상태가 된다", async () => {
  expect(await connectWithPassword("mom", PASSWORD, fakeKidsnote)).toEqual({ kind: "connected" });
  expect(await connectionStatus()).toBe("connected");
});

test("연결한 뒤 비밀번호 문자열은 저장 파일 어디에도 없다 (AC2)", async () => {
  await connectWithPassword("mom", PASSWORD, fakeKidsnote);
  const saved = await readFile(process.env.HOME_MEAL_DATA_FILE!, "utf8");
  expect(saved).not.toContain(PASSWORD);
});

test("틀린 비밀번호는 연결하지 않고 실패로 돌려준다", async () => {
  const bad = (async () => new Response("{}", { status: 400 })) as typeof fetch;
  expect(await connectWithPassword("mom", "wrong", bad)).toEqual({ kind: "failed" });
  expect(await connectionStatus()).toBe("none");
});

test("세션이 만료되면 만료 상태가 된다 (AC3)", async () => {
  await connectWithPassword("mom", PASSWORD, fakeKidsnote);
  await markExpired();
  expect(await connectionStatus()).toBe("expired");
});
