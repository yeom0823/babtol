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
