import { expect, test } from "vitest";

import { leftoverSoupOf } from "./leftover";
import type { DayPlan, HomeDish } from "./types";

const soup = (name: string, servings: number, leftover?: boolean): HomeDish => ({
  name,
  groups: [],
  mainIngredients: [],
  leftover,
  recipe: { minutes: 20, servings, ingredients: [], steps: [], kidNote: "싱겁게" },
});
const dinner = (...dishes: HomeDish[]): DayPlan => ({ dinner: { why: "", dishes } });

test("2~3회 분량 국이 있던 저녁이면 그 국을 다음 날 이어 쓴다 (가정 A8)", () => {
  expect(leftoverSoupOf(dinner(soup("소고기무국", 3)))?.name).toBe("소고기무국");
  expect(leftoverSoupOf(dinner(soup("미역국", 2)))?.name).toBe("미역국");
});

test("1회 분량이거나 국이 아니면 이어 쓰지 않는다", () => {
  expect(leftoverSoupOf(dinner(soup("미역국", 1)))).toBeNull();
  expect(leftoverSoupOf(dinner(soup("닭고기 감자조림", 3)))).toBeNull();
  expect(leftoverSoupOf(null)).toBeNull();
});

test("이미 이어 쓴 국은 한 번 더 이어 쓰지 않는다", () => {
  expect(leftoverSoupOf(dinner(soup("소고기무국", 3, true)))).toBeNull();
});
