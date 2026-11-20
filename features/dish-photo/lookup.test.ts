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

type Row = { RCP_NM: string; ATT_FILE_NO_MAIN: string };

/** 실제 API처럼 RCP_NM에 검색어가 들어간 레시피를 돌려주는 가짜 DB. */
const db = (rows: Row[], log: string[] = []) =>
  (async (url: string | URL | Request) => {
    const q = decodeURIComponent(String(url).split("RCP_NM=")[1] ?? "");
    log.push(q);
    return new Response(JSON.stringify({ COOKRCP01: { row: rows.filter((r) => r.RCP_NM.includes(q)) } }));
  }) as typeof fetch;

test("이름이 같은 요리가 있으면 그 사진 주소를 쓴다", async () => {
  const f = db([
    { RCP_NM: "소고기무국 레시피", ATT_FILE_NO_MAIN: "http://x/other.jpg" },
    { RCP_NM: "소고기무국", ATT_FILE_NO_MAIN: "http://x/beef.jpg" },
  ]);
  expect(await photoFor("소고기무국", f)).toBe("http://x/beef.jpg");
});

test("같은 이름이 없으면 핵심 단어가 들어간 레시피 사진을 쓴다", async () => {
  const f = db([
    { RCP_NM: "채소죽", ATT_FILE_NO_MAIN: "http://x/veg.jpg" },
    { RCP_NM: "호박죽", ATT_FILE_NO_MAIN: "http://x/pumpkin.jpg" },
  ]);
  expect(await photoFor("닭가슴살 채소죽", f)).toBe("http://x/veg.jpg");
});

test("띄어쓰기가 없는 이름은 뒷부분(요리 종류)으로 찾는다", async () => {
  const f = db([{ RCP_NM: "미역국", ATT_FILE_NO_MAIN: "http://x/seaweed.jpg" }]);
  expect(await photoFor("두부미역국", f)).toBe("http://x/seaweed.jpg");
});

test("여러 개가 걸리면 이름이 가장 짧은(가장 기본인) 레시피를 쓴다", async () => {
  const f = db([
    { RCP_NM: "시금치나물 비빔밥", ATT_FILE_NO_MAIN: "http://x/bibim.jpg" },
    { RCP_NM: "시금치나물", ATT_FILE_NO_MAIN: "http://x/spinach.jpg" },
  ]);
  expect(await photoFor("유기농 시금치나물", f)).toBe("http://x/spinach.jpg");
});

test("앞쪽 재료 이름만으로는 찾지 않는다 (다른 요리 사진이 붙지 않게)", async () => {
  const f = db([{ RCP_NM: "닭가슴살 말이", ATT_FILE_NO_MAIN: "http://x/roll.jpg" }]);
  expect(await photoFor("닭가슴살 채소죽", f)).toBeNull();
});

test("관련 있는 레시피가 없으면 사진이 없다 (기본 모양)", async () => {
  const f = db([{ RCP_NM: "김치찌개", ATT_FILE_NO_MAIN: "http://x/kimchi.jpg" }]);
  expect(await photoFor("요거트 과일 믹스", f)).toBeNull();
});

test("한 글자 이름은 정확히 같을 때만 쓴다", async () => {
  const f = db([{ RCP_NM: "배숙", ATT_FILE_NO_MAIN: "http://x/pear.jpg" }]);
  expect(await photoFor("배", f)).toBeNull();
});

test("요청은 몇 번까지만 한다", async () => {
  const log: string[] = [];
  await photoFor("아주 길고 긴 처음 보는 요리 이름", db([], log));
  expect(log.length).toBeLessThanOrEqual(4);
});

test("찾은 결과는 저장해서 다시 요청하지 않는다", async () => {
  const log: string[] = [];
  const f = db([{ RCP_NM: "귤", ATT_FILE_NO_MAIN: "http://x/g.jpg" }], log);
  await photoFor("귤", f);
  await photoFor("귤", f);
  expect(log.length).toBe(1);
});

test("인증키가 없거나 요청이 실패하면 사진 없이 넘어가고, 실패는 저장하지 않는다", async () => {
  delete process.env.FOODSAFETY_API_KEY;
  expect(await photoFor("귤", db([]))).toBeNull();
  process.env.FOODSAFETY_API_KEY = "test-key";
  const broken = (async () => {
    throw new Error("network");
  }) as typeof fetch;
  expect(await photoFor("사과", broken)).toBeNull();
  expect(await photoFor("사과", db([{ RCP_NM: "사과", ATT_FILE_NO_MAIN: "http://x/a.jpg" }]))).toBe("http://x/a.jpg");
});

test("띄어쓰기만 다른 이름은 같은 요리로 본다", async () => {
  const f = db([{ RCP_NM: "소고기 무국", ATT_FILE_NO_MAIN: "http://x/beef.jpg" }]);
  expect(await photoFor("소고기무국", f)).toBe("http://x/beef.jpg");
});
