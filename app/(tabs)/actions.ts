"use server";

import { revalidatePath } from "next/cache";

import { FOOD_GROUPS, type FoodGroup, type MealKey } from "@/features/meal-plan";
import { buildPlan, fillGroup, swapDish, swapMeal } from "@/features/today";

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
