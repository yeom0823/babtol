import { readStore, updateStore } from "@/lib/local-store";

import type { DayPlan, HomeDish } from "./types";

const KEY = "dayPlans";
type Plans = Record<string, DayPlan>;

/** 추천은 날짜별로 한 번 만들어 저장한다(가정 A10). */
export async function getPlan(iso: string): Promise<DayPlan | null> {
  return (await readStore<Plans>(KEY, {}))[iso] ?? null;
}

export async function savePlan(iso: string, plan: DayPlan): Promise<void> {
  await updateStore<Plans>(KEY, {}, (all) => ({ ...all, [iso]: plan }));
}

const BOOK = "dishBook";

/** 잘 먹은 메뉴처럼 나중에 다시 쓸 메뉴의 레시피를 기억해 둔다. 추천에서 바뀌어 빠져도 남는다. */
export async function keepDish(dish: HomeDish): Promise<void> {
  await updateStore<Record<string, HomeDish>>(BOOK, {}, (book) => ({ ...book, [dish.name]: dish }));
}

/** 기억해 둔 메뉴를 먼저 찾고, 없으면 저장된 추천 가운데 가장 최근에 나온 그 이름의 메뉴를 찾는다. */
export async function findDishByName(name: string): Promise<HomeDish | null> {
  const kept = (await readStore<Record<string, HomeDish>>(BOOK, {}))[name];
  if (kept) return kept;
  const plans = await readStore<Plans>(KEY, {});
  for (const iso of Object.keys(plans).sort().reverse()) {
    for (const meal of Object.values(plans[iso])) {
      const found = meal?.dishes.find((d) => d.name === name);
      if (found) return found;
    }
  }
  return null;
}
