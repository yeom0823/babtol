import { canonicalIngredient, foodGroupsOfText } from "./food-groups";
import type { DayPlan, HomeDish, MealKey } from "./types";

export type ViolationRule =
  | "overlap"
  | "avoid"
  | "resting"
  | "kid-note"
  | "choking"
  | "unsafe"
  | "breakfast-time"
  | "dinner-shape"
  | "duplicate";
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

const words = (name: string) => name.trim().split(/\s+/).filter(Boolean);

/**
 * 같은 메뉴인지: 띄어쓰기만 다르거나, 한쪽 이름의 낱말이 모두 다른 쪽에 들어 있으면("배"와 "배 변") 같다고 본다.
 * 낱말 단위로 비교해서 "배"와 "배추김치"처럼 글자만 겹치는 메뉴는 다르게 본다.
 */
export function sameDish(a: string, b: string): boolean {
  if (a.replace(/\s+/g, "") === b.replace(/\s+/g, "")) return true;
  const [short, long] = words(a).length <= words(b).length ? [words(a), words(b)] : [words(b), words(a)];
  return short.length > 0 && short.every((w) => long.includes(w));
}

// 저녁 반찬으로 세지 않는 후식. 과일은 식품군으로 따로 판단한다.
const DESSERT = /푸딩|요거트|요구르트|케이크|쿠키|젤리|아이스크림|주스|스무디|과자|빵/;
const onlyFruit = (groups: string[]) => groups.length > 0 && groups.every((g) => g === "과일");
/** 밥, 과일, 후식을 뺀 저녁 반찬(국 포함)인지. */
const isSideDish = (d: HomeDish) =>
  !d.basic && !DESSERT.test(d.name) && !onlyFruit(d.groups) && !onlyFruit(foodGroupsOfText(d.name));

const textOf = (d: HomeDish) =>
  [d.name, ...d.recipe.ingredients.map((i) => i.name), ...d.recipe.steps].join(" ");

/** 모델이 만든 추천이 규칙(겹침, 피할 음식, 안전, 아침 시간)을 어긴 곳을 찾는다. */
export function findViolations(plan: DayPlan, ctx: PlanContext): Violation[] {
  const out: Violation[] = [];
  const daycare = new Set(ctx.daycareIngredients.map(canonicalIngredient));

  // 저녁은 밥·국·반찬 2가지 한 상이다(가정 A2). 밥을 기본으로 표시하지 않았어도 세 가지 이상이면 받는다.
  // 과일이나 후식으로 개수를 채우지 않게 반찬으로 세지 않는다.
  if (plan.dinner && plan.dinner.dishes.filter(isSideDish).length < 3) {
    out.push({ meal: "dinner", dish: "저녁 한 상", rule: "dinner-shape", detail: "밥, 국, 반찬 2가지를 모두 넣어 주세요. 과일과 후식은 반찬으로 세지 않아요" });
  }

  for (const [meal, home] of Object.entries(plan) as [MealKey, NonNullable<DayPlan[MealKey]>][]) {
    home.dishes.forEach((dish, index) => {
      if (dish.basic) return;
      const add = (rule: ViolationRule, detail: string) =>
        out.push({ meal, dish: dish.name, rule, detail });

      const twin = home.dishes.slice(0, index).find((d) => !d.basic && sameDish(d.name, dish.name));
      if (twin) add("duplicate", `${twin.name}와(과) 같은 메뉴예요. 다른 메뉴로 골라 주세요`);

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
    });
  }
  return out;
}
