import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, expect, test } from "vitest";

import { photoFor } from "./lookup";

let dir: string;
beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), "photo-"));
  process.env.HOME_MEAL_DATA_FILE = join(dir, "data.json");
  process.env.FOODSAFETY_API_KEY = "test-key";
});
afterEach(async () => {
  delete process.env.HOME_MEAL_DATA_FILE;
  delete process.env.FOODSAFETY_API_KEY;
  await rm(dir, { recursive: true, force: true });
});

const reply = (rows: { RCP_NM: string; ATT_FILE_NO_MAIN: string }[]) =>
  (async () => new Response(JSON.stringify({ COOKRCP01: { row: rows } }))) as typeof fetch;

test("이름이 같은 요리가 있으면 그 사진 주소를 쓴다", async () => {
  const f = reply([
    { RCP_NM: "소고기무국 레시피", ATT_FILE_NO_MAIN: "http://x/other.jpg" },
    { RCP_NM: "소고기무국", ATT_FILE_NO_MAIN: "http://x/beef.jpg" },
  ]);
  expect(await photoFor("소고기무국", f)).toBe("http://x/beef.jpg");
});

test("이름이 같은 요리가 없으면 사진이 없다 (기본 모양)", async () => {
  const f = reply([{ RCP_NM: "소고기무국 레시피", ATT_FILE_NO_MAIN: "http://x/other.jpg" }]);
  expect(await photoFor("소고기무국", f)).toBeNull();
});

test("찾은 결과는 저장해서 다시 요청하지 않는다", async () => {
  let calls = 0;
  const f = (async () => {
    calls++;
    return new Response(JSON.stringify({ COOKRCP01: { row: [{ RCP_NM: "귤", ATT_FILE_NO_MAIN: "http://x/g.jpg" }] } }));
  }) as typeof fetch;
  await photoFor("귤", f);
  await photoFor("귤", f);
  expect(calls).toBe(1);
});

test("인증키가 없거나 요청이 실패하면 사진 없이 넘어간다", async () => {
  delete process.env.FOODSAFETY_API_KEY;
  expect(await photoFor("귤", reply([]))).toBeNull();
  process.env.FOODSAFETY_API_KEY = "test-key";
  const broken = (async () => { throw new Error("network"); }) as typeof fetch;
  expect(await photoFor("사과", broken)).toBeNull();
});

test("띄어쓰기만 다른 이름은 같은 요리로 본다", async () => {
  const f = reply([{ RCP_NM: "소고기 무국", ATT_FILE_NO_MAIN: "http://x/beef.jpg" }]);
  expect(await photoFor("소고기무국", f)).toBe("http://x/beef.jpg");
});
