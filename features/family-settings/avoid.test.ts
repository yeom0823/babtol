import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, expect, test } from "vitest";

import { addAvoid, listAvoid, parseAvoidInput, removeAvoid } from "./avoid";

let dir: string;
beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), "avoid-"));
  process.env.HOME_MEAL_DATA_FILE = join(dir, "data.json");
});
afterEach(async () => {
  delete process.env.HOME_MEAL_DATA_FILE;
  await rm(dir, { recursive: true, force: true });
});

test("쉼표나 공백으로 나눠 적은 피할 음식을 나눈다", () => {
  expect(parseAvoidInput("땅콩, 새우  메밀,, 땅콩")).toEqual(["땅콩", "새우", "메밀"]);
  expect(parseAvoidInput("   ")).toEqual([]);
});

test("피할 음식을 더하고 빼면 목록에 반영된다 (AC16)", async () => {
  expect(await listAvoid()).toEqual([]);
  await addAvoid("땅콩, 새우");
  await addAvoid("새우 메밀");
  expect(await listAvoid()).toEqual(["땅콩", "새우", "메밀"]);
  await removeAvoid("새우");
  expect(await listAvoid()).toEqual(["땅콩", "메밀"]);
});
