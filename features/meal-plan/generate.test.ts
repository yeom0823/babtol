import { expect, test } from "vitest";

import { PlanError, generateDayPlan, type PlanModel } from "./generate";
import type { PlanInput } from "./prompt";
import type { DayPlan, HomeDish } from "./types";

const withIngredients = (names: string[]) => names.map((name) => ({ name, amount: "약간" }));
const dish = (name: string, over: Partial<HomeDish> = {}): HomeDish => ({
  name,
  groups: ["채소"],
  mainIngredients: [],
  recipe: {
    minutes: 8,
    servings: 1,
    ingredients: [{ name: "애호박", amount: "1/3개" }],
    steps: ["얇게 썰어요."],
    kidNote: "싱겁게, 잘게 주세요.",
  },
  ...over,
});
const meal = (...dishes: HomeDish[]) => ({ why: "고루 먹도록 골랐어요.", dishes });
// 어린이집 식단과 합쳐 다섯 식품군을 모두 채우는 정상 추천.
const okPlan = (): DayPlan => ({
  breakfast: meal(
    dish("바나나 오트밀", {
      recipe: { ...dish("x").recipe, ingredients: withIngredients(["오트밀", "우유", "바나나"]) },
    })
  ),
  snack: meal(dish("귤", { recipe: { ...dish("x").recipe, ingredients: withIngredients(["귤"]) } })),
  dinner: meal(
    dish("애호박전", {
      recipe: { ...dish("x").recipe, ingredients: withIngredients(["달걀", "애호박"]) },
    })
  ),
});

const input: PlanInput = {
  date: "2026-11-17",
  kind: "daycare",
  daycare: { lunch: ["잡곡밥", "두부장국"], morningSnack: [], afternoonSnack: [] },
  avoid: ["땅콩"],
  resting: [],
  favorites: [],
};

test("규칙을 지킨 추천은 한 번에 받는다", async () => {
  let calls = 0;
  const model: PlanModel = async () => {
    calls++;
    return okPlan();
  };
  expect(await generateDayPlan(input, model)).toEqual(okPlan());
  expect(calls).toBe(1);
});

test("규칙을 어기면 어긴 곳을 알려 주고 다시 받는다 (AC14, AC16)", async () => {
  const prompts: string[] = [];
  let n = 0;
  const model: PlanModel = async ({ user }) => {
    prompts.push(user);
    if (n++ === 0) {
      const bad = okPlan();
      bad.dinner = meal(dish("두부조림", { mainIngredients: ["두부"] }), dish("땅콩죽"));
      return bad;
    }
    return okPlan();
  };
  expect(await generateDayPlan(input, model)).toEqual(okPlan());
  expect(prompts).toHaveLength(2);
  expect(prompts[1]).toContain("두부조림");
  expect(prompts[1]).toContain("땅콩죽");
});

test("계속 어기면 어긴 추천을 내보내지 않고 실패한다 (AC16)", async () => {
  const model: PlanModel = async () => {
    const bad = okPlan();
    bad.dinner = meal(dish("땅콩죽"));
    return bad;
  };
  await expect(generateDayPlan(input, model)).rejects.toBeInstanceOf(PlanError);
});

test("모델이 형식에 맞지 않는 답을 주면 다시 받는다", async () => {
  let n = 0;
  const model: PlanModel = async () => (n++ === 0 ? { breakfast: "엉뚱한 글" } : okPlan());
  expect(await generateDayPlan(input, model)).toEqual(okPlan());
  expect(n).toBe(2);
});

test("쉬는 날은 점심도 집 끼니로 받는다", async () => {
  const off: PlanInput = { ...input, kind: "off", daycare: null };
  let lunchAsked = false;
  const model: PlanModel = async ({ user }) => {
    lunchAsked = user.includes("추천할 끼니: 아침, 점심, 간식, 저녁");
    return { ...okPlan(), lunch: meal(dish("소고기 채소죽")) };
  };
  const plan = await generateDayPlan(off, model);
  expect(lunchAsked).toBe(true);
  expect(plan.lunch?.dishes[0].name).toBe("소고기 채소죽");
});
