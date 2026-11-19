import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, expect, test } from "vitest";

import { getMenu, saveMenus } from "./repository";

let dir: string;
beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), "menu-repo-"));
  process.env.HOME_MEAL_DATA_FILE = join(dir, "data.json");
});
afterEach(async () => {
  delete process.env.HOME_MEAL_DATA_FILE;
  await rm(dir, { recursive: true, force: true });
});

const monday = { lunch: ["현미밥", "감자국"], morningSnack: ["사과"], afternoonSnack: ["떡"] };

test("저장한 날짜의 식단은 출처와 함께 다시 읽힌다", async () => {
  await saveMenus({ "2026-11-23": monday }, "upload");
  expect(await getMenu("2026-11-23")).toMatchObject({ ...monday, source: "upload" });
});

test("저장하지 않은 날짜는 식단이 없다", async () => {
  expect(await getMenu("2026-11-24")).toBeNull();
});

test("같은 날짜를 다시 저장하면 새 내용으로 바뀌고 다른 날짜는 그대로다", async () => {
  await saveMenus({ "2026-11-23": monday, "2026-11-24": monday }, "kidsnote");
  await saveMenus({ "2026-11-23": { ...monday, lunch: ["카레"] } }, "upload");
  expect((await getMenu("2026-11-23"))?.lunch).toEqual(["카레"]);
  expect((await getMenu("2026-11-23"))?.source).toBe("upload");
  expect((await getMenu("2026-11-24"))?.source).toBe("kidsnote");
});
