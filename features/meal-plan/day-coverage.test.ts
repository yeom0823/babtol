import { expect, test } from "vitest";

import { dayCoverage } from "./day-coverage";
import type { DayPlan, HomeDish } from "./types";

const dish = (name: string, ingredients: string[], groups: HomeDish["groups"] = []): HomeDish => ({
  name,
  groups,
  mainIngredients: [],
  recipe: { minutes: 5, servings: 1, ingredients: ingredients.map((n) => ({ name: n, amount: "약간" })), steps: [], kidNote: "잘게" },
});
const plan: DayPlan = {
  breakfast: { why: "", dishes: [dish("바나나 오트밀", ["오트밀", "우유", "바나나"])] },
  snack: { why: "", dishes: [dish("사과", ["사과"])] },
  dinner: { why: "", dishes: [dish("소고기무국", ["소고기", "무"])] },
};
const daycare = { lunch: ["잡곡밥", "두부장국", "시금치나물"], morningSnack: [], afternoonSnack: [] };

test("어린이집 식단과 집 끼니를 합쳐 식품군마다 출처를 보여 준다 (AC13)", () => {
  const { sources, missing } = dayCoverage(plan, daycare);
  expect(sources["과일"]).toEqual(["집 아침", "집 간식"]);
  expect(sources["곡류"]).toEqual(["어린이집 점심", "집 아침"]);
  expect(sources["고기·생선·달걀·콩"]).toEqual(["어린이집 점심", "집 저녁"]);
  expect(missing).toEqual([]);
});

test("빈 식품군을 알려 준다", () => {
  const { missing, sources } = dayCoverage({ snack: plan.snack }, null);
  expect(sources["과일"]).toEqual(["집 간식"]);
  expect(missing).toEqual(["곡류", "고기·생선·달걀·콩", "채소", "우유·유제품"]);
});

test("메뉴 이름과 재료로 식품군을 찾지 못하면 모델이 적은 식품군을 쓴다", () => {
  const odd: DayPlan = { snack: { why: "", dishes: [dish("특제 간식", ["비밀 가루"], ["곡류"])] } };
  expect(dayCoverage(odd, null).sources["곡류"]).toEqual(["집 간식"]);
});
