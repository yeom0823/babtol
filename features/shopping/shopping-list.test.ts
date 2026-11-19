import { expect, test } from "vitest";

import type { DayPlan, HomeDish } from "@/features/meal-plan";

import { shoppingList, shoppingText } from "./shopping-list";

const dish = (name: string, ings: [string, string][], over: Partial<HomeDish> = {}): HomeDish => ({
  name,
  groups: [],
  mainIngredients: [],
  recipe: { minutes: 10, servings: 1, ingredients: ings.map(([n, a]) => ({ name: n, amount: a })), steps: [], kidNote: "잘게" },
  ...over,
});
const days: { iso: string; plan: DayPlan }[] = [
  {
    iso: "2026-11-18",
    plan: {
      breakfast: { why: "", dishes: [dish("바나나 오트밀", [["오트밀", "3큰술"], ["우유", "120ml"], ["바나나", "1/2개"]])] },
      snack: { why: "", dishes: [dish("귤", [["귤", "1개"]])] },
      dinner: {
        why: "",
        dishes: [
          dish("밥", [["쌀", "1/2컵"]], { basic: true }),
          dish("소고기무국", [["소고기 양지", "60g"], ["무", "80g"], ["국간장", "1/2작은술"], ["참기름", "약간"], ["물", "500ml"]]),
          dish("애호박전", [["애호박", "1/3개"], ["계란", "1개"], ["부침가루", "1큰술"]]),
        ],
      },
    },
  },
  {
    iso: "2026-11-19",
    plan: {
      breakfast: { why: "", dishes: [dish("달걀 토스트", [["식빵", "1장"], ["달걀", "1개"]])] },
      dinner: {
        why: "",
        dishes: [
          dish("소고기무국", [["소고기 양지", "60g"], ["무", "80g"]], { leftover: true }),
          dish("시금치나물", [["시금치", "50g"], ["깨", "약간"], ["멸치육수", "조금"]]),
        ],
      },
    },
  },
];

const all = (list: ReturnType<typeof shoppingList>) => list.groups.flatMap((g) => g.items);

test("고른 기간의 추천 재료를 빠짐없이 담고 늘 있는 재료와 밥은 뺀다 (AC12, 가정 A9)", () => {
  const names = all(shoppingList(days)).map((i) => i.name).sort();
  expect(names).toEqual(
    ["귤", "달걀", "무", "바나나", "소고기 양지", "시금치", "식빵", "애호박", "오트밀", "우유"].sort()
  );
});

test("이름이 달라도 같은 재료는 하나로 모으고 어디에 쓰는지 적는다", () => {
  const egg = all(shoppingList(days)).find((i) => i.name === "달걀")!;
  expect(egg.uses).toEqual(["18일 애호박전", "19일 달걀 토스트"]);
});

test("어제 끓인 국의 재료는 그날 장보기에서 빠진다 (AC11)", () => {
  const beef = all(shoppingList(days)).find((i) => i.name === "소고기 양지")!;
  expect(beef.uses).toEqual(["18일 소고기무국"]);
});

test("재료는 식품군별로 묶는다", () => {
  const groups = Object.fromEntries(shoppingList(days).groups.map((g) => [g.category, g.items.map((i) => i.name)]));
  expect(groups["과일"]).toEqual(expect.arrayContaining(["귤", "바나나"]));
  expect(groups["채소"]).toEqual(expect.arrayContaining(["무", "애호박", "시금치"]));
  expect(groups["고기·생선·달걀·콩"]).toEqual(expect.arrayContaining(["소고기 양지", "달걀"]));
});

test("집 끼니 수를 센다", () => {
  expect(shoppingList(days).meals).toBe(5);
});

test("복사 글에는 체크하지 않은 재료만 들어간다 (AC12)", () => {
  const list = shoppingList(days);
  const text = shoppingText(list, new Set(["귤", "우유"]), "11월 18일~19일");
  expect(text).toContain("바나나");
  expect(text).not.toContain("귤");
  expect(text).not.toContain("우유");
  expect(text.split("\n")[0]).toBe("장보기 (11월 18일~19일)");
});
