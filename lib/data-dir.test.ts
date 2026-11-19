import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, expect, test } from "vitest";

import { dataDir } from "@/lib/data-dir";

const saved = { ...process.env };
afterEach(() => {
  process.env = { ...saved };
});

test("로컬에서는 프로젝트의 .data 폴더를 쓴다", () => {
  delete process.env.VERCEL;
  delete process.env.HOME_MEAL_DATA_DIR;
  expect(dataDir()).toBe(join(process.cwd(), ".data"));
});

test("Vercel처럼 프로젝트 폴더에 쓸 수 없는 곳에서는 임시 폴더를 쓴다", () => {
  process.env.VERCEL = "1";
  delete process.env.HOME_MEAL_DATA_DIR;
  expect(dataDir()).toBe(join(tmpdir(), "home-meal"));
});

test("HOME_MEAL_DATA_DIR로 폴더를 직접 정할 수 있다", () => {
  process.env.VERCEL = "1";
  process.env.HOME_MEAL_DATA_DIR = "/data/custom";
  expect(dataDir()).toBe("/data/custom");
});
