import { FOOD_GROUPS, dayGroupSources, foodGroupsOfText, type FoodGroup } from "./food-groups";
import { MEAL_KO } from "./prompt";
import type { DayPlan, HomeDish, MealKey } from "./types";

type Daycare = { lunch: string[]; morningSnack: string[]; afternoonSnack: string[] };

/** 메뉴 이름과 재료로 찾은 식품군을 우선하고, 못 찾으면 모델이 적은 식품군을 쓴다. */
function groupsOfDish(dish: HomeDish): FoodGroup[] {
  const text = [dish.name, ...dish.recipe.ingredients.map((i) => i.name)].join(" ");
  const found = foodGroupsOfText(text);
  return found.length ? found : dish.groups;
}

/**
 * 하루 식품군: 어린이집 식단과 집 끼니를 합쳐 식품군마다 어디서 채웠는지 보여 주고,
 * 비어 있는 식품군을 알려 준다(AC13).
 */
export function dayCoverage(plan: DayPlan, daycare: Daycare | null) {
  const parts: { label: string; groups: FoodGroup[] }[] = [];
  if (daycare) {
    parts.push({ label: "어린이집 점심", groups: foodGroupsOfText(daycare.lunch.join(" ")) });
    parts.push({
      label: "어린이집 간식",
      groups: foodGroupsOfText([...daycare.morningSnack, ...daycare.afternoonSnack].join(" ")),
    });
  }
  for (const meal of ["breakfast", "lunch", "snack", "dinner"] as MealKey[]) {
    const home = plan[meal];
    if (!home) continue;
    const groups = [...new Set(home.dishes.flatMap(groupsOfDish))];
    parts.push({ label: `집 ${MEAL_KO[meal]}`, groups });
  }
  const sources = dayGroupSources(parts);
  return { sources, missing: FOOD_GROUPS.filter((g) => !sources[g].length) };
}
