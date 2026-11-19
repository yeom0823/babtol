import { readStore, updateStore } from "@/lib/local-store";

import type { DayPlan } from "./types";

const KEY = "dayPlans";
type Plans = Record<string, DayPlan>;

/** 추천은 날짜별로 한 번 만들어 저장한다(가정 A10). */
export async function getPlan(iso: string): Promise<DayPlan | null> {
  return (await readStore<Plans>(KEY, {}))[iso] ?? null;
}

export async function savePlan(iso: string, plan: DayPlan): Promise<void> {
  await updateStore<Plans>(KEY, {}, (all) => ({ ...all, [iso]: plan }));
}
