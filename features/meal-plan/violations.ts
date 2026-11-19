import { canonicalIngredient } from "./food-groups";
import type { DayPlan, HomeDish, MealKey } from "./types";

export type ViolationRule =
  | "overlap"
  | "avoid"
  | "resting"
  | "kid-note"
  | "choking"
  | "unsafe"
  | "breakfast-time"
  | "dinner-shape";
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
// "회" 한 글자는 "1회", "회색"에도 걸려서 회 요리 이름으로만 찾는다. 꿀고구마는 고구마 품종이다.
const UNSAFE = /꿀(?!고구마)|날달걀|생달걀|날것|육회|생선회|반숙|덜 익/;
// "꿀은 넣지 않아요", "덜 익지 않게"처럼 쓰지 말라는 문장은 위반으로 보지 않는다.
const NEGATED = /않|말고|말아|없이|대신|금지|빼고|피해/;
const affirmative = (texts: string[]) =>
  texts.flatMap((t) => t.split(/(?<=[.!?。])\s+|,\s*/)).filter((s) => !NEGATED.test(s)).join(" ");

const textOf = (d: HomeDish) =>
  [d.name, ...d.recipe.ingredients.map((i) => i.name), ...d.recipe.steps].join(" ");

/** 모델이 만든 추천이 규칙(겹침, 피할 음식, 안전, 아침 시간)을 어긴 곳을 찾는다. */
export function findViolations(plan: DayPlan, ctx: PlanContext): Violation[] {
  const out: Violation[] = [];
  const daycare = new Set(ctx.daycareIngredients.map(canonicalIngredient));

  // 저녁은 밥·국·반찬 2가지 한 상이다(가정 A2). 밥을 기본으로 표시하지 않았어도 세 가지 이상이면 받는다.
  if (plan.dinner && plan.dinner.dishes.filter((d) => !d.basic).length < 3) {
    out.push({ meal: "dinner", dish: "저녁 한 상", rule: "dinner-shape", detail: "밥, 국, 반찬 2가지를 모두 넣어 주세요" });
  }

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
      const unsafe = affirmative([dish.name, ...dish.recipe.ingredients.map((i) => i.name), ...dish.recipe.steps]).match(UNSAFE);
      // 걸린 말을 함께 알려 줘야 모델이 그 부분만 고친다.
      if (unsafe) add("unsafe", `꿀, 날것, 덜 익힌 달걀은 쓰지 않아요 ("${unsafe[0]}")`);
      if (meal === "breakfast" && dish.recipe.minutes > 10) {
        add("breakfast-time", `아침은 10분 이하여야 해요 (${dish.recipe.minutes}분)`);
      }
    }
  }
  return out;
}
