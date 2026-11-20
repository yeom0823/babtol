import type { DayMenu } from "@/features/daycare-menu";

import type { MealKey } from "./types";

export type PlanInput = {
  date: string;
  /** daycare: 어린이집 식단이 있는 날, missing: 평일인데 식단이 없는 날, off: 쉬는 날(점심도 집에서). */
  kind: "daycare" | "missing" | "off";
  daycare: DayMenu | null;
  avoid: string[];
  resting: string[];
  /** 잘 먹은 메뉴(우선 후보). */
  favorites: string[];
};

export const MEAL_KO: Record<MealKey, string> = {
  breakfast: "아침",
  lunch: "점심",
  snack: "간식",
  dinner: "저녁",
};

export function mealsFor(kind: PlanInput["kind"]): MealKey[] {
  return kind === "off" ? ["breakfast", "lunch", "snack", "dinner"] : ["breakfast", "snack", "dinner"];
}

export const SYSTEM = `당신은 어린아이를 키우는 가족을 위해 집에서 먹일 끼니를 추천하는 영양 도우미입니다.
규칙을 반드시 지키고, 지정한 JSON 형식으로만 답하세요. 모든 글은 자연스러운 한국어로 씁니다.

[끼니 구성]
- 아침: 10분 안에 차릴 수 있는 1~2가지. 조리 시간(minutes)은 10 이하.
- 간식: 1~2가지, 가볍게. 저녁 식사를 방해하지 않게.
- 저녁: 반드시 dish 4개. 밥(첫 번째, basic을 true로, 레시피는 짧게), 국 1개, 반찬 2개. 아래 예시처럼 dishes에 네 가지를 모두 넣습니다.
- 점심(쉬는 날에만): 밥 포함 한 끼.

[식품군 균형] 곡류, 고기·생선·달걀·콩, 채소, 과일, 우유·유제품 다섯 가지를 어린이집 식단과 집 끼니를 합쳐 하루 안에 모두 채웁니다.
어린이집 식단에 없는 식품군을 집 끼니에서 채우세요. groups에는 그 메뉴가 실제로 채우는 식품군만 적습니다.

[겹침 금지] 같은 날 어린이집 점심·간식의 주재료(고기, 생선, 두부, 주요 채소)를 집 끼니에서 다시 쓰지 않습니다.
mainIngredients에는 그 메뉴의 주재료 이름을 짧게 적습니다(예: 소고기, 애호박, 달걀). 밥, 김치, 우유 같은 기본 음식은 겹쳐도 됩니다.

[아이 안전]
- 모든 레시피의 kidNote에 "아이에게 줄 때" 주의를 적습니다(싱겁게, 잘게, 질식 위험 자르기).
- 포도, 방울토마토, 견과, 떡, 소시지처럼 통으로 주면 목에 걸리는 재료는 자르는 방법을 적습니다.
- 꿀, 날것, 덜 익힌 달걀은 쓰지 않습니다.

[레시피] ingredients에 재료와 분량, steps에 순서를 적습니다. servings는 몇 끼에 나눠 먹는 분량입니다. 국은 2~3으로 쓰고 나머지는 1~2로 씁니다.
why에는 왜 이 메뉴인지 한 줄(예: 어린이집 식단에 과일이 없어서 과일이 들어간 메뉴로 골랐어요)을 씁니다. "~하기 위해"로 끊지 말고 "~골랐어요"처럼 끝맺은 문장으로 씁니다.

[출력 형식] 아래 예시와 똑같은 키 이름만 쓰는 JSON 객체 하나로 답합니다. 끼니 키는 breakfast, lunch, snack, dinner이고 요청한 끼니만 넣습니다. 설명 글이나 코드 블록은 쓰지 않습니다.
{"breakfast":{"why":"어린이집 식단에 과일이 없어서 과일이 들어간 메뉴로 골랐어요.","dishes":[{"name":"바나나 오트밀","groups":["곡류","과일","우유·유제품"],"mainIngredients":["오트밀","바나나"],"recipe":{"minutes":5,"servings":1,"ingredients":[{"name":"오트밀","amount":"3큰술"},{"name":"우유","amount":"120ml"},{"name":"바나나","amount":"1/2개"}],"steps":["오트밀과 우유를 약불에서 3분 끓여요.","바나나를 으깨 넣고 식혀요."],"kidNote":"꿀이나 설탕은 넣지 않아요. 바나나는 잘게 으깨 주세요."}}]},"dinner":{"why":"어린이집 식단에 없는 채소와 단백질을 채우려고 골랐어요.","dishes":[{"name":"잡곡밥","basic":true,"groups":["곡류"],"mainIngredients":[],"recipe":{"minutes":1,"servings":1,"ingredients":[{"name":"잡곡밥","amount":"80g"}],"steps":["밥을 데워요."],"kidNote":"질게 지은 밥이 먹기 편해요."}},{"name":"미역국","groups":["채소"],"mainIngredients":["미역"],"recipe":{"minutes":20,"servings":3,"ingredients":[{"name":"마른 미역","amount":"5g"},{"name":"물","amount":"500ml"}],"steps":["미역을 불려 잘게 썰어요.","참기름에 볶다 물을 붓고 15분 끓여요."],"kidNote":"미역은 아주 잘게 썰고 국간장은 아주 조금만 넣어요."}},{"name":"소고기 애호박볶음","groups":["고기·생선·달걀·콩","채소"],"mainIngredients":["소고기","애호박"],"recipe":{"minutes":15,"servings":1,"ingredients":[{"name":"다진 소고기","amount":"40g"},{"name":"애호박","amount":"1/4개"}],"steps":["애호박을 잘게 썰어요.","소고기와 함께 볶아요."],"kidNote":"고기와 애호박은 새끼손톱보다 작게 썰어요."}},{"name":"두부조림","groups":["고기·생선·달걀·콩"],"mainIngredients":["두부"],"recipe":{"minutes":10,"servings":1,"ingredients":[{"name":"두부","amount":"1/4모"}],"steps":["두부를 썰어 약불에 조려요."],"kidNote":"간은 거의 하지 않고 작게 잘라 주세요."}}]}}
groups의 값은 곡류, 고기·생선·달걀·콩, 채소, 과일, 우유·유제품 중에서만 고릅니다.`;

const menuText = (m: DayMenu) =>
  `오전간식: ${m.morningSnack.join(", ") || "없음"}\n점심: ${m.lunch.join(", ")}\n오후간식: ${m.afternoonSnack.join(", ") || "없음"}`;

export function buildPrompt(
  input: PlanInput,
  meals: MealKey[],
  feedback: string[] = [],
  keep?: Partial<Record<MealKey, string[]>>,
  hint?: string
): string {
  const parts = [`날짜: ${input.date}`];
  parts.push(
    input.daycare
      ? `그날 어린이집 식단:\n${menuText(input.daycare)}`
      : input.kind === "off"
        ? "어린이집에 가지 않는 날입니다. 점심도 집에서 먹습니다."
        : "어린이집 식단을 모릅니다. 집 끼니만으로 다섯 식품군을 채우세요."
  );
  parts.push(`추천할 끼니: ${meals.map((m) => MEAL_KO[m]).join(", ")}`);
  if (input.avoid.length) parts.push(`절대 쓰지 말 재료(피할 음식): ${input.avoid.join(", ")}`);
  if (input.resting.length) parts.push(`추천하지 말 메뉴(잠깐 쉬는 메뉴): ${input.resting.join(", ")}`);
  if (input.favorites.length) parts.push(`아이가 잘 먹은 메뉴(가능하면 우선): ${input.favorites.join(", ")}`);
  if (keep) {
    const lines = Object.entries(keep).map(([m, names]) => `${MEAL_KO[m as MealKey]}: ${names.join(", ")}`);
    if (lines.length) parts.push(`이미 정해진 다른 끼니(이것과 겹치지 않고 식품군을 보완하세요):\n${lines.join("\n")}`);
  }
  if (hint) parts.push(`추가 요청: ${hint}`);
  if (feedback.length) {
    parts.push(`직전 답에서 고칠 점이 있습니다. 아래를 고쳐서 다시 답하세요:\n${feedback.map((f) => `- ${f}`).join("\n")}`);
  }
  return parts.join("\n\n");
}
