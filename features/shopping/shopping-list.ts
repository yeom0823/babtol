import {
  FOOD_GROUPS,
  canonicalIngredient,
  foodGroupsOfText,
  type DayPlan,
} from "@/features/meal-plan";
import { parseISODate } from "@/lib/date";

export type ShoppingItem = { name: string; amount: string; uses: string[] };
export type ShoppingList = { groups: { category: string; items: ShoppingItem[] }[]; meals: number };

/** 늘 있는 재료라 장보기에서 뺀다(가정 A9). 띄어쓰기는 따지지 않는다. */
const PANTRY = new Set(
  ["국간장", "간장", "참기름", "깨", "물", "된장", "멸치 육수", "부침가루", "밥"].map((s) =>
    s.replace(/\s/g, "")
  )
);
const isPantry = (name: string) => PANTRY.has(name.replace(/\s/g, ""));

/**
 * 고른 날짜들의 집 끼니 재료를 모은다. 같은 재료는 하나로 모으고 식품군별로 묶는다.
 * 밥처럼 기본으로 곁들이는 음식과 어제 끓인 국(AC11)의 재료는 사지 않는다.
 */
export function shoppingList(days: { iso: string; plan: DayPlan }[]): ShoppingList {
  const byKey = new Map<string, { originals: string[]; amount: string; uses: string[] }>();
  let meals = 0;
  for (const { iso, plan } of [...days].sort((a, b) => a.iso.localeCompare(b.iso))) {
    const day = parseISODate(iso).getDate();
    for (const meal of Object.values(plan)) {
      if (!meal?.dishes.length) continue;
      meals++;
      for (const dish of meal.dishes) {
        if (dish.basic || dish.leftover) continue;
        for (const ing of dish.recipe.ingredients) {
          const name = ing.name.trim();
          if (!name || isPantry(name)) continue;
          const key = canonicalIngredient(name);
          const entry = byKey.get(key) ?? { originals: [], amount: ing.amount, uses: [] };
          if (!entry.originals.includes(name)) entry.originals.push(name);
          const use = `${day}일 ${dish.name}`;
          if (!entry.uses.includes(use)) entry.uses.push(use);
          byKey.set(key, entry);
        }
      }
    }
  }

  const grouped = new Map<string, ShoppingItem[]>();
  for (const [key, entry] of byKey) {
    const name = entry.originals.includes(key) ? key : entry.originals[0];
    const category = foodGroupsOfText(entry.originals.join(" "))[0] ?? "기타";
    grouped.set(category, [...(grouped.get(category) ?? []), { name, amount: entry.amount, uses: entry.uses }]);
  }
  const order = [...FOOD_GROUPS, "기타"] as string[];
  return {
    groups: order
      .filter((c) => grouped.has(c))
      .map((category) => ({ category, items: grouped.get(category)! })),
    meals,
  };
}

/** 메신저로 보낼 글. 체크하지 않은(집에 없는) 재료만 담는다. */
export function shoppingText(list: ShoppingList, checked: Set<string>, label: string): string {
  const lines = list.groups
    .flatMap((g) => g.items)
    .filter((i) => !checked.has(i.name))
    .map((i) => `- ${i.name} ${i.uses.length > 1 ? `(${i.uses.length}번 써요)` : i.amount}`);
  return [`장보기 (${label})`, ...lines].join("\n");
}
