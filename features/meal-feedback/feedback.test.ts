import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, expect, test } from "vitest";

import {
  favoriteNamesFor,
  getFeedbackFor,
  listFavorites,
  listResting,
  releaseResting,
  restingNamesFor,
  setFeedback,
} from "./feedback";

let dir: string;
beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), "feedback-"));
  process.env.HOME_MEAL_DATA_FILE = join(dir, "data.json");
});
afterEach(async () => {
  delete process.env.HOME_MEAL_DATA_FILE;
  await rm(dir, { recursive: true, force: true });
});

const mark = (date: string, name: string, value: "잘 먹음" | "보통" | "남김" | null, meal: string = "dinner") =>
  setFeedback({ date, meal, name, value });

test("누른 반응은 그 날짜의 메뉴에 표시되고, 다시 누르면 취소된다 (AC7)", async () => {
  await mark("2026-11-17", "소고기무국", "잘 먹음");
  expect(await getFeedbackFor("2026-11-17")).toEqual({ 소고기무국: "잘 먹음" });
  await mark("2026-11-17", "소고기무국", null);
  expect(await getFeedbackFor("2026-11-17")).toEqual({});
});

test("같은 메뉴의 반응을 바꾸면 마지막 반응만 남는다", async () => {
  await mark("2026-11-17", "귤", "잘 먹음");
  await mark("2026-11-17", "귤", "남김");
  expect(await getFeedbackFor("2026-11-17")).toEqual({ 귤: "남김" });
});

test("아무것도 누르지 않은 날은 빈 반응이다 (AC7)", async () => {
  expect(await getFeedbackFor("2026-11-18")).toEqual({});
  expect(await restingNamesFor("2026-11-18")).toEqual([]);
});

test("남김은 다음 날부터 14일 동안 쉬고 그날과 15일째부터는 쉬지 않는다 (AC8)", async () => {
  await mark("2026-11-17", "시금치나물", "남김");
  expect(await restingNamesFor("2026-11-17")).toEqual([]);
  expect(await restingNamesFor("2026-11-18")).toEqual(["시금치나물"]);
  expect(await restingNamesFor("2026-12-01")).toEqual(["시금치나물"]);
  expect(await restingNamesFor("2026-12-02")).toEqual([]);
});

test("잠깐 쉬는 메뉴 목록은 언제까지 쉬는지 보여 준다 (AC8)", async () => {
  await mark("2026-11-17", "시금치나물", "남김");
  expect(await listResting("2026-11-19")).toEqual([{ name: "시금치나물", until: "2026-12-01" }]);
  expect(await listResting("2026-12-05")).toEqual([]);
});

test("되돌리면 바로 다시 추천 후보가 되고, 다시 남기면 또 쉰다 (AC8)", async () => {
  await mark("2026-11-17", "시금치나물", "남김");
  await releaseResting("시금치나물");
  expect(await restingNamesFor("2026-11-20")).toEqual([]);
  expect(await listResting("2026-11-19")).toEqual([]);
  await mark("2026-11-19", "시금치나물", "남김");
  expect(await restingNamesFor("2026-11-20")).toEqual(["시금치나물"]);
});

test("남김을 취소하면 쉬지 않는다", async () => {
  await mark("2026-11-17", "귤", "남김");
  await mark("2026-11-17", "귤", null);
  expect(await restingNamesFor("2026-11-18")).toEqual([]);
});

test("잘 먹음을 누른 메뉴는 횟수와 마지막 날짜, 끼니와 함께 모인다 (AC9)", async () => {
  await mark("2026-11-12", "애호박 달걀전", "잘 먹음", "dinner");
  await mark("2026-11-16", "바나나 오트밀", "잘 먹음", "breakfast");
  await mark("2026-11-17", "바나나 오트밀", "잘 먹음", "breakfast");
  await mark("2026-11-17", "귤", "보통", "snack");
  expect(await listFavorites("2026-11-19")).toEqual([
    { name: "바나나 오트밀", count: 2, lastDate: "2026-11-17", meal: "breakfast" },
    { name: "애호박 달걀전", count: 1, lastDate: "2026-11-12", meal: "dinner" },
  ]);
});

test("잘 먹은 메뉴는 우선 후보지만 바로 다음 날에는 다시 내지 않는다 (A4)", async () => {
  await mark("2026-11-16", "바나나 오트밀", "잘 먹음");
  await mark("2026-11-12", "애호박 달걀전", "잘 먹음");
  expect(await favoriteNamesFor("2026-11-17")).toEqual(["애호박 달걀전"]);
  expect(await favoriteNamesFor("2026-11-18")).toEqual(["바나나 오트밀", "애호박 달걀전"]);
});

test("남김으로 쉬는 메뉴는 잘 먹은 메뉴 목록에서 빠진다", async () => {
  await mark("2026-11-10", "귤", "잘 먹음");
  await mark("2026-11-17", "귤", "남김");
  expect((await listFavorites("2026-11-19")).map((f) => f.name)).not.toContain("귤");
});
