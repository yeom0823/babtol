import type { HomeDish, HomeMeal } from "./types";

const isSoup = (name: string) => /(국|탕|찌개)$/.test(name);

/**
 * 메뉴 하나를 끼니의 알맞은 칸에 넣는다. 국은 국 자리, 반찬은 마지막 반찬 자리, 하나뿐인
 * 아침·간식은 그 자리에 넣고 밥은 그대로 둔다. 이미 들어 있으면 바꾸지 않는다.
 */
export function placeDish(meal: HomeMeal, dish: HomeDish): HomeMeal {
  if (meal.dishes.some((d) => d.name === dish.name)) return meal;
  const slots = meal.dishes.map((d, i) => ({ d, i })).filter(({ d }) => !d.basic);
  const soups = slots.filter(({ d }) => isSoup(d.name));
  const sides = slots.filter(({ d }) => !isSoup(d.name));
  const target = isSoup(dish.name)
    ? (soups[0] ?? sides[0])
    : slots.length > 1
      ? (sides.at(-1) ?? slots[0])
      : slots[0];
  if (!target) return { ...meal, dishes: [...meal.dishes, dish] };
  return { ...meal, dishes: meal.dishes.map((d, i) => (i === target.i ? dish : d)) };
}
