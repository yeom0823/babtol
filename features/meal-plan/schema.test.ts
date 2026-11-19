import { expect, test } from "vitest";

import { mealSchema } from "./schema";

const base = {
  name: "바나나 오트밀",
  groups: ["곡류", "과일"],
  mainIngredients: ["오트밀"],
  recipe: {
    minutes: 5,
    servings: 1,
    ingredients: [{ name: "오트밀", amount: "3큰술" }],
    steps: ["끓여요."],
    kidNote: "잘게 으깨 주세요.",
  },
};
const meal = (dish: unknown) => ({ why: "과일이 없어서 골랐어요.", dishes: [dish] });

test("형식에 맞는 메뉴는 그대로 받는다", () => {
  expect(mealSchema.parse(meal(base)).dishes[0].recipe.kidNote).toBe("잘게 으깨 주세요.");
});

test("kidNote를 recipe 밖 메뉴 단계에 써도 recipe로 옮겨 받는다", () => {
  const { kidNote, ...recipe } = base.recipe;
  const parsed = mealSchema.parse(meal({ ...base, recipe, kidNote }));
  expect(parsed.dishes[0].recipe.kidNote).toBe("잘게 으깨 주세요.");
});

test("정해진 값이 아닌 식품군 이름은 버리고 나머지를 받는다", () => {
  const parsed = mealSchema.parse(meal({ ...base, groups: ["탄수화물", "과일"] }));
  expect(parsed.dishes[0].groups).toEqual(["과일"]);
});

test("분량이 숫자나 글로 와도 글로 받고, 시간이 글이어도 숫자로 받는다", () => {
  const parsed = mealSchema.parse(
    meal({
      ...base,
      recipe: { ...base.recipe, minutes: "7", ingredients: [{ name: "우유", amount: 120 }] },
    })
  );
  expect(parsed.dishes[0].recipe.minutes).toBe(7);
  expect(parsed.dishes[0].recipe.ingredients[0].amount).toBe("120");
});

test("아이 주의가 어디에도 없으면 받지 않는다 (AC17)", () => {
  const recipe: Partial<typeof base.recipe> = { ...base.recipe };
  delete recipe.kidNote;
  expect(mealSchema.safeParse(meal({ ...base, recipe })).success).toBe(false);
});
