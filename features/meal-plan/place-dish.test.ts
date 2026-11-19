import { expect, test } from "vitest";

import { placeDish } from "./place-dish";
import type { HomeDish } from "./types";

const dish = (name: string, basic = false): HomeDish => ({
  name,
  groups: [],
  mainIngredients: [],
  basic,
  recipe: { minutes: 5, servings: 1, ingredients: [], steps: [], kidNote: "잘게" },
});
const names = (m: { dishes: HomeDish[] }) => m.dishes.map((d) => d.name);

test("아침이나 간식은 하나뿐인 메뉴 자리에 들어간다", () => {
  const meal = { why: "", dishes: [dish("바나나 요거트")] };
  expect(names(placeDish(meal, dish("바나나 오트밀")))).toEqual(["바나나 오트밀"]);
});

test("국은 국 자리에, 반찬은 마지막 반찬 자리에 들어가고 밥은 그대로 둔다", () => {
  const dinner = { why: "", dishes: [dish("밥", true), dish("미역국"), dish("두부조림"), dish("시금치나물")] };
  expect(names(placeDish(dinner, dish("소고기무국")))).toEqual(["밥", "소고기무국", "두부조림", "시금치나물"]);
  expect(names(placeDish(dinner, dish("애호박전")))).toEqual(["밥", "미역국", "두부조림", "애호박전"]);
});

test("이미 들어 있는 메뉴는 그대로 둔다", () => {
  const dinner = { why: "", dishes: [dish("밥", true), dish("미역국"), dish("애호박전")] };
  expect(names(placeDish(dinner, dish("애호박전")))).toEqual(["밥", "미역국", "애호박전"]);
});

test("국이 없는 상에 국을 넣으면 첫 반찬 자리에 들어간다", () => {
  const meal = { why: "", dishes: [dish("밥", true), dish("계란말이")] };
  expect(names(placeDish(meal, dish("미역국")))).toEqual(["밥", "미역국"]);
});
