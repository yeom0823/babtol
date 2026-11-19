import { canonicalIngredient } from "./food-groups";
import type { DayPlan, HomeDish, MealKey } from "./types";

export type ViolationRule =
  | "overlap"
  | "avoid"
  | "resting"
  | "kid-note"
  | "choking"
  | "unsafe"
  | "breakfast-time";
export type Violation = { meal: MealKey; dish: string; rule: ViolationRule; detail: string };

export type PlanContext = {
  /** 같은 날 어린이집 점심·간식의 주재료(정규화된 이름). */
  daycareIngredients: string[];
  avoid: string[];
  /** 잠깐 쉬는 메뉴 이름. */
  resting: string[];
};

/** 통으로 주면 목에 걸릴 수 있는 재료(AC17). */
const CHOKING = /포도|방울토마토|견과|땅콩|아몬드|호두|캐슈|잣|떡|소시지|메추리알|체리/;
const CUT_WORDS = /자르|잘라|썰|다지|다져|으깨|찢|갈아|반으로|등분|조각|쪼개/;
const UNSAFE = /꿀|날달걀|생달걀|날것|회|반숙|덜 익/;

const textOf = (d: HomeDish) =>
  [d.name, ...d.recipe.ingredients.map((i) => i.name), ...d.recipe.steps].join(" ");

/** 모델이 만든 추천이 규칙(겹침, 피할 음식, 안전, 아침 시간)을 어긴 곳을 찾는다. */
export function findViolations(plan: DayPlan, ctx: PlanContext): Violation[] {
  const out: Violation[] = [];
  const daycare = new Set(ctx.daycareIngredients.map(canonicalIngredient));

  for (const [meal, home] of Object.entries(plan) as [MealKey, NonNullable<DayPlan[MealKey]>][]) {
    for (const dish of home.dishes) {
      if (dish.basic) continue;
      const add = (rule: ViolationRule, detail: string) =>
        out.push({ meal, dish: dish.name, rule, detail });

      for (const ing of dish.mainIngredients.map(canonicalIngredient)) {
        if (daycare.has(ing)) add("overlap", `어린이집 식단에 이미 ${ing}이(가) 있어요`);
      }
      const all = textOf(dish);
      for (const word of ctx.avoid) {
        if (word && all.includes(word)) add("avoid", `피할 음식 ${word}`);
      }
      if (ctx.resting.includes(dish.name)) add("resting", "잠깐 쉬는 메뉴");

      if (!dish.recipe.kidNote.trim()) add("kid-note", "두 돌 아이에게 줄 때 주의가 없어요");
      const ingredients = dish.recipe.ingredients.map((i) => i.name).join(" ");
      if (CHOKING.test(`${dish.name} ${ingredients}`)) {
        const how = `${dish.recipe.kidNote} ${dish.recipe.steps.join(" ")}`;
        if (!CUT_WORDS.test(how)) add("choking", "목에 걸릴 수 있는 재료인데 자르는 방법이 없어요");
      }
      if (UNSAFE.test(all)) add("unsafe", "꿀, 날것, 덜 익힌 달걀은 쓰지 않아요");
      if (meal === "breakfast" && dish.recipe.minutes > 10) {
        add("breakfast-time", `아침은 10분 이하여야 해요 (${dish.recipe.minutes}분)`);
      }
    }
  }
  return out;
}
