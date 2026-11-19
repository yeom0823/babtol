import { expect, test } from "vitest";

import { findViolations } from "./violations";
import type { DayPlan, HomeDish } from "./types";

const dish = (over: Partial<HomeDish> & { name: string }): HomeDish => ({
  groups: ["채소"],
  mainIngredients: [],
  recipe: {
    minutes: 8,
    servings: 1,
    ingredients: [{ name: "애호박", amount: "1/3개" }],
    steps: ["애호박을 얇게 썰어요."],
    kidNote: "싱겁게, 잘게 썰어 주세요.",
  },
  ...over,
});
const plan = (breakfast: HomeDish[]): DayPlan => ({ breakfast: { why: "", dishes: breakfast } });
const ctx = { daycareIngredients: ["두부", "생선"], avoid: ["땅콩"], resting: ["시금치나물"] };

test("문제가 없는 추천은 위반이 없다", () => {
  expect(findViolations(plan([dish({ name: "애호박전", mainIngredients: ["애호박", "달걀"] })]), ctx)).toEqual([]);
});

test("어린이집과 주재료가 같은 메뉴는 겹침이다 (AC14)", () => {
  const v = findViolations(plan([dish({ name: "두부조림", mainIngredients: ["두부"] })]), ctx);
  expect(v).toMatchObject([{ meal: "breakfast", dish: "두부조림", rule: "overlap" }]);
});

test("재료 이름이 달라도 같은 재료면 겹침이다", () => {
  const v = findViolations(plan([dish({ name: "삼치구이", mainIngredients: ["삼치"] })]), ctx);
  expect(v.map((x) => x.rule)).toEqual(["overlap"]);
});

test("피할 음식이 이름이나 재료에 들어가면 위반이다 (AC16)", () => {
  const byName = findViolations(plan([dish({ name: "땅콩죽" })]), ctx);
  const byIng = findViolations(
    plan([dish({ name: "무침", recipe: { ...dish({ name: "x" }).recipe, ingredients: [{ name: "땅콩버터", amount: "1큰술" }] } })]),
    ctx
  );
  expect(byName.map((x) => x.rule)).toContain("avoid");
  expect(byIng.map((x) => x.rule)).toContain("avoid");
});

test("잠깐 쉬는 메뉴는 추천할 수 없다 (AC16)", () => {
  const v = findViolations(plan([dish({ name: "시금치나물" })]), ctx);
  expect(v.map((x) => x.rule)).toContain("resting");
});

test("아이 주의 문구가 비어 있으면 위반이다 (AC17)", () => {
  const empty = dish({ name: "애호박전" });
  empty.recipe.kidNote = "  ";
  expect(findViolations(plan([empty]), ctx).map((x) => x.rule)).toContain("kid-note");
});

test("목에 걸릴 수 있는 재료는 자르는 방법이 없으면 위반이다 (AC17)", () => {
  const grape = dish({
    name: "포도 요거트",
    recipe: {
      minutes: 3,
      servings: 1,
      ingredients: [{ name: "포도", amount: "5알" }],
      steps: ["그릇에 담아요."],
      kidNote: "천천히 먹여 주세요.",
    },
  });
  expect(findViolations(plan([grape]), ctx).map((x) => x.rule)).toContain("choking");
  grape.recipe.kidNote = "포도는 4등분으로 잘라 주세요.";
  expect(findViolations(plan([grape]), ctx).map((x) => x.rule)).not.toContain("choking");
});

test("꿀, 날것, 덜 익힌 달걀을 쓰면 위반이다 (AC17)", () => {
  const honey = dish({
    name: "꿀 토스트",
    recipe: { ...dish({ name: "x" }).recipe, ingredients: [{ name: "꿀", amount: "1작은술" }] },
  });
  const runny = dish({
    name: "반숙 달걀",
    recipe: { ...dish({ name: "x" }).recipe, steps: ["달걀을 반숙으로 익혀요."] },
  });
  expect(findViolations(plan([honey]), ctx).map((x) => x.rule)).toContain("unsafe");
  expect(findViolations(plan([runny]), ctx).map((x) => x.rule)).toContain("unsafe");
});

test("꿀을 넣지 말라는 문장이나 횟수 표현은 위반이 아니다", () => {
  const safe = dish({
    name: "호박고구마조림",
    recipe: {
      ...dish({ name: "x" }).recipe,
      steps: ["꿀 대신 사과즙을 조금 넣어요.", "하루 1회 분량으로 덜어요.", "덜 익지 않게 충분히 조려요."],
    },
  });
  expect(findViolations(plan([safe]), ctx).map((x) => x.rule)).not.toContain("unsafe");
});

test("아침 메뉴는 조리 시간이 10분 이하여야 한다 (AC18)", () => {
  const slow = dish({ name: "소고기죽" });
  slow.recipe.minutes = 25;
  expect(findViolations(plan([slow]), ctx).map((x) => x.rule)).toContain("breakfast-time");
  expect(
    findViolations({ dinner: { why: "", dishes: [slow] } }, ctx).map((x) => x.rule)
  ).not.toContain("breakfast-time");
});

test("기본으로 곁들이는 밥은 검사하지 않는다", () => {
  const rice = dish({ name: "잡곡밥", basic: true });
  rice.recipe.kidNote = "";
  expect(findViolations({ dinner: { why: "", dishes: [rice] } }, ctx).filter((v) => v.dish === "잡곡밥")).toEqual([]);
});

test("저녁은 밥·국·반찬 2가지 한 상이어야 한다 (가정 A2)", () => {
  const soupOnly = { dinner: { why: "", dishes: [dish({ name: "미역국" })] } };
  expect(findViolations(soupOnly, ctx).map((x) => x.rule)).toContain("dinner-shape");
  const full = {
    dinner: {
      why: "",
      dishes: [dish({ name: "밥", basic: true }), dish({ name: "미역국" }), dish({ name: "애호박전" }), dish({ name: "무나물" })],
    },
  };
  expect(findViolations(full, ctx).map((x) => x.rule)).not.toContain("dinner-shape");
});
