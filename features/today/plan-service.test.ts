import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, expect, test } from "vitest";

import { saveMenus } from "@/features/daycare-menu/server";
import type { DayPlan, HomeDish } from "@/features/meal-plan";
import type { PlanModel } from "@/features/meal-plan/server";

import { addAvoid } from "@/features/family-settings";
import { setFeedback } from "@/features/meal-feedback";
import { savePlan } from "@/features/meal-plan/server";

import {
  buildPlan,
  fillGroup,
  insertFavorite,
  loadPlan,
  rememberDish,
  swapDish,
  swapMeal,
} from "./plan-service";

let dir: string;
beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), "plan-service-"));
  process.env.HOME_MEAL_DATA_FILE = join(dir, "data.json");
  await saveMenus(
    { "2026-11-17": { lunch: ["잡곡밥", "두부장국"], morningSnack: [], afternoonSnack: [] } },
    "upload"
  );
});
afterEach(async () => {
  delete process.env.HOME_MEAL_DATA_FILE;
  await rm(dir, { recursive: true, force: true });
});

const dish = (name: string, ingredients: string[]): HomeDish => ({
  name,
  groups: [],
  mainIngredients: [],
  recipe: {
    minutes: 5,
    servings: 1,
    ingredients: ingredients.map((n) => ({ name: n, amount: "약간" })),
    steps: ["만들어요."],
    kidNote: "잘게 주세요.",
  },
});
const meal = (...d: HomeDish[]) => ({ why: "골랐어요.", dishes: d });
const fullPlan = (tag = ""): DayPlan => ({
  breakfast: meal(dish(`바나나 오트밀${tag}`, ["오트밀", "우유", "바나나"])),
  snack: meal(dish(`귤${tag}`, ["귤"])),
  // 저녁은 밥·국·반찬 2가지 한 상(가정 A2).
  dinner: meal(dish(`미역국${tag}`, ["미역"]), dish(`애호박전${tag}`, ["달걀", "애호박"]), dish(`무나물${tag}`, ["무"])),
});

function countingModel(make: (n: number, user: string) => unknown) {
  const calls: string[] = [];
  const model: PlanModel = async ({ user }) => {
    calls.push(user);
    return make(calls.length, user);
  };
  return { model, calls };
}

test("만든 추천은 저장되어 같은 날을 다시 열어도 모델을 부르지 않는다 (A10)", async () => {
  const { model, calls } = countingModel(() => fullPlan());
  await buildPlan("2026-11-17", model);
  expect((await loadPlan("2026-11-17"))?.breakfast?.dishes[0].name).toBe("바나나 오트밀");
  await buildPlan("2026-11-17", model);
  expect(calls).toHaveLength(1);
});

test("같은 날짜를 동시에 만들어도 모델은 한 번만 부른다", async () => {
  const { model, calls } = countingModel(() => fullPlan());
  await Promise.all([buildPlan("2026-11-17", model), buildPlan("2026-11-17", model)]);
  expect(calls).toHaveLength(1);
});

test("어린이집 식단을 모델에 알려 준다", async () => {
  const { model, calls } = countingModel(() => fullPlan());
  await buildPlan("2026-11-17", model);
  expect(calls[0]).toContain("두부장국");
});

test("다른 아침 보기는 아침만 바꾸고 나머지 끼니는 그대로 둔다 (AC6)", async () => {
  const { model } = countingModel((n) =>
    n === 1 ? fullPlan() : { breakfast: meal(dish("달걀 치즈 토스트", ["식빵", "달걀", "치즈"])) }
  );
  await buildPlan("2026-11-17", model);
  await swapMeal("2026-11-17", "breakfast", model);
  const plan = (await loadPlan("2026-11-17"))!;
  expect(plan.breakfast?.dishes[0].name).toBe("달걀 치즈 토스트");
  expect(plan.snack?.dishes[0].name).toBe("귤");
  expect(plan.dinner?.dishes.map((d) => d.name)).toEqual(["미역국", "애호박전", "무나물"]);
});

test("이것만 바꾸기는 그 메뉴 하나만 바꾼다 (AC6)", async () => {
  const dinner = meal(dish("밥", ["쌀"]), dish("소고기무국", ["소고기", "무"]), dish("애호박전", ["달걀", "애호박"]), dish("무나물", ["무"]));
  dinner.dishes[0].basic = true;
  const { model } = countingModel((n) =>
    n === 1
      ? { ...fullPlan(), dinner }
      : { dinner: meal(dish("밥", ["쌀"]), dish("미역국", ["미역"]), dish("달걀찜", ["달걀"]), dish("무나물", ["무"])) }
  );
  await buildPlan("2026-11-17", model);
  await swapDish("2026-11-17", "dinner", 1, model);
  const names = (await loadPlan("2026-11-17"))!.dinner!.dishes.map((d) => d.name);
  expect(names).toEqual(["밥", "미역국", "애호박전", "무나물"]);
});

test("빈 식품군 채우기는 그 식품군이 들어간 끼니로 바꾼다 (AC13)", async () => {
  const noFruit: DayPlan = {
    breakfast: meal(dish("달걀 토스트", ["식빵", "달걀", "우유"])),
    snack: meal(dish("고구마", ["고구마"])),
    dinner: meal(dish("미역국", ["미역"]), dish("애호박전", ["달걀", "애호박"]), dish("무나물", ["무"])),
  };
  const { model, calls } = countingModel((n) =>
    n === 1 ? noFruit : { snack: meal(dish("바나나", ["바나나"])) }
  );
  await buildPlan("2026-11-17", model);
  await fillGroup("2026-11-17", "과일", model);
  expect((await loadPlan("2026-11-17"))!.snack!.dishes[0].name).toBe("바나나");
  expect(calls[1]).toContain("과일");
});

test("피할 음식, 잠깐 쉬는 메뉴, 잘 먹은 메뉴를 모델에 알려 준다 (AC16)", async () => {
  await addAvoid("땅콩, 새우");
  await setFeedback({ date: "2026-11-10", meal: "dinner", name: "시금치나물", value: "남김" });
  await setFeedback({ date: "2026-11-09", meal: "breakfast", name: "바나나 오트밀", value: "잘 먹음" });
  const { model, calls } = countingModel(() => fullPlan());
  await buildPlan("2026-11-17", model);
  expect(calls[0]).toContain("땅콩, 새우");
  expect(calls[0]).toContain("시금치나물");
  expect(calls[0]).toContain("바나나 오트밀");
});

test("잘 먹은 메뉴를 오늘 그 끼니의 해당 칸에 넣는다 (AC9)", async () => {
  const soup = dish("소고기무국", ["소고기", "무"]);
  soup.recipe.steps = ["끓여요."];
  await savePlan("2026-11-12", {
    dinner: meal(soup),
  });
  const dinner = meal(dish("밥", ["쌀"]), dish("미역국", ["미역"]), dish("애호박전", ["달걀", "애호박"]), dish("무나물", ["무"]));
  dinner.dishes[0].basic = true;
  const { model } = countingModel(() => ({ ...fullPlan(), dinner }));
  await insertFavorite("2026-11-17", "dinner", "소고기무국", model);
  const names = (await loadPlan("2026-11-17"))!.dinner!.dishes.map((d) => d.name);
  expect(names).toEqual(["밥", "소고기무국", "애호박전", "무나물"]);
});

test("잘 먹음을 누른 메뉴는 추천에서 바뀌어 빠져도 오늘 끼니에 넣을 수 있다 (AC9)", async () => {
  const { model } = countingModel((n) =>
    n === 1 ? fullPlan() : { breakfast: meal(dish("달걀 치즈 토스트", ["식빵", "달걀", "치즈"])) }
  );
  await buildPlan("2026-11-17", model);
  await rememberDish("2026-11-17", "바나나 오트밀");
  await swapMeal("2026-11-17", "breakfast", model);
  await insertFavorite("2026-11-17", "breakfast", "바나나 오트밀", model);
  expect((await loadPlan("2026-11-17"))!.breakfast!.dishes[0].name).toBe("바나나 오트밀");
});

test("전날 2~3회 분량 국을 끓였으면 다음 날 저녁 국 자리에 어제 끓인 국이 들어간다 (AC11)", async () => {
  const soup = dish("소고기무국", ["소고기", "무"]);
  soup.recipe.servings = 3;
  const rice = dish("밥", ["쌀"]);
  rice.basic = true;
  await savePlan("2026-11-16", { dinner: meal(rice, soup, dish("애호박전", ["달걀", "애호박"])) });
  const { model } = countingModel(() => ({
    ...fullPlan(),
    dinner: meal(rice, dish("미역국", ["미역"]), dish("시금치나물", ["시금치"]), dish("애호박전", ["달걀", "애호박"])),
  }));
  await buildPlan("2026-11-17", model);
  const dinner = (await loadPlan("2026-11-17"))!.dinner!.dishes;
  expect(dinner.map((d) => d.name)).toEqual(["밥", "소고기무국", "시금치나물", "애호박전"]);
  expect(dinner[1].leftover).toBe(true);
});
