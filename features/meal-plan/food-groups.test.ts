import { expect, test } from "vitest";

import {
  FOOD_GROUPS,
  canonicalIngredient,
  dayGroupSources,
  foodGroupsOfText,
  mainIngredientsOf,
} from "./food-groups";

test("식품군은 다섯 가지다", () => {
  expect(FOOD_GROUPS).toEqual(["곡류", "고기·생선·달걀·콩", "채소", "과일", "우유·유제품"]);
});

test("같은 재료의 다른 이름은 하나로 모은다", () => {
  expect(canonicalIngredient("쇠고기")).toBe("소고기");
  expect(canonicalIngredient("계란")).toBe("달걀");
  expect(canonicalIngredient("닭")).toBe("닭고기");
  expect(canonicalIngredient(" 소고기 ")).toBe("소고기");
});

test("어린이집 메뉴 글에서 주재료를 찾고 밥·김치·우유 같은 기본 음식은 뺀다 (가정 A6)", () => {
  expect(mainIngredientsOf("잡곡밥, 두부장국, 생선까스, 양배추새콤무침, 깍두기").sort()).toEqual(
    ["두부", "생선", "양배추"].sort()
  );
  expect(mainIngredientsOf("씨리얼, 유기농우유")).toEqual([]);
  expect(mainIngredientsOf("소고기버섯밥, 물만둣국, 깻잎나물, 배추김치").sort()).toEqual(
    ["깻잎", "버섯", "소고기"].sort()
  );
});

test("무침의 '무'나 단무지의 '무'를 무 재료로 보지 않는다", () => {
  expect(mainIngredientsOf("오이무침, 단무지")).toEqual(["오이"]);
  expect(mainIngredientsOf("무생채, 소고기무국")).toEqual(expect.arrayContaining(["무", "소고기"]));
});

test("메뉴 글이 채우는 식품군을 찾는다", () => {
  expect(foodGroupsOfText("바나나, 우유")).toEqual(expect.arrayContaining(["과일", "우유·유제품"]));
  expect(foodGroupsOfText("잡곡밥, 두부장국, 시금치나물")).toEqual(
    expect.arrayContaining(["곡류", "고기·생선·달걀·콩", "채소"])
  );
  expect(foodGroupsOfText("깍두기")).toEqual([]);
});

test("하루 식품군은 식품군마다 어디서 채웠는지 출처를 모은다 (AC13)", () => {
  const src = dayGroupSources([
    { label: "어린이집 점심", groups: ["곡류", "채소"] },
    { label: "집 아침", groups: ["과일", "곡류"] },
    { label: "집 간식", groups: ["과일"] },
  ]);
  expect(src["곡류"]).toEqual(["어린이집 점심", "집 아침"]);
  expect(src["과일"]).toEqual(["집 아침", "집 간식"]);
  expect(src["우유·유제품"]).toEqual([]);
});
