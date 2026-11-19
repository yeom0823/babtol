"use server";

import { revalidatePath } from "next/cache";

import { releaseResting, setFeedback, type FeedbackValue } from "@/features/meal-feedback";
import { FOOD_GROUPS, type FoodGroup, type MealKey } from "@/features/meal-plan";
import {
  buildPlan,
  fillGroup,
  insertFavorite,
  rememberDish,
  swapDish,
  swapMeal,
} from "@/features/today/server";
import { toISODate } from "@/lib/date";

export type ActionResult = { ok: boolean };

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const MEALS: MealKey[] = ["breakfast", "lunch", "snack", "dinner"];

// 서버 액션은 화면 밖에서도 직접 호출될 수 있어 입력을 먼저 확인한다.
async function run(iso: string, job: () => Promise<unknown>): Promise<ActionResult> {
  if (!ISO_DATE.test(iso)) return { ok: false };
  try {
    await job();
    revalidatePath("/");
    return { ok: true };
  } catch (e) {
    console.error("추천 작업 실패:", e instanceof Error ? e.message : e);
    return { ok: false };
  }
}

export async function buildPlanAction(iso: string): Promise<ActionResult> {
  return run(iso, () => buildPlan(iso));
}

export async function swapMealAction(iso: string, meal: MealKey): Promise<ActionResult> {
  if (!MEALS.includes(meal)) return { ok: false };
  return run(iso, () => swapMeal(iso, meal));
}

export async function swapDishAction(iso: string, meal: MealKey, index: number): Promise<ActionResult> {
  if (!MEALS.includes(meal) || !Number.isInteger(index) || index < 0) return { ok: false };
  return run(iso, () => swapDish(iso, meal, index));
}

export async function fillGroupAction(iso: string, group: FoodGroup): Promise<ActionResult> {
  if (!FOOD_GROUPS.includes(group)) return { ok: false };
  return run(iso, () => fillGroup(iso, group));
}

const VALUES: FeedbackValue[] = ["잘 먹음", "보통", "남김"];

/** 먹은 결과 한 번 누르기. value가 null이면 취소한다. */
export async function setFeedbackAction(
  iso: string,
  meal: MealKey,
  name: string,
  value: FeedbackValue | null
): Promise<ActionResult> {
  if (!MEALS.includes(meal) || !name || (value !== null && !VALUES.includes(value))) return { ok: false };
  return run(iso, async () => {
    await setFeedback({ date: iso, meal, name, value });
    if (value === "잘 먹음") await rememberDish(iso, name);
  });
}

/** 잘 먹은 메뉴를 오늘 그 끼니에 넣는다(AC9). */
export async function insertFavoriteAction(meal: MealKey, name: string): Promise<ActionResult> {
  if (!MEALS.includes(meal) || !name) return { ok: false };
  const today = toISODate(new Date());
  const result = await run(today, () => insertFavorite(today, meal, name));
  revalidatePath("/favs");
  return result;
}

/** 잠깐 쉬는 메뉴를 다시 추천받게 되돌린다(AC8). */
export async function releaseRestingAction(name: string): Promise<ActionResult> {
  if (!name) return { ok: false };
  await releaseResting(name);
  revalidatePath("/favs");
  revalidatePath("/");
  return { ok: true };
}
