import { getMenu } from "@/features/daycare-menu/server";
import { listAvoid } from "@/features/family-settings";
import { favoriteNamesFor, restingNamesFor } from "@/features/meal-feedback";
import {
  leftoverSoupOf,
  type DayPlan,
  type FoodGroup,
  type MealKey,
  type PlanInput,
} from "@/features/meal-plan";
import { addDays } from "@/lib/date";
import {
  PlanError,
  findDishByName,
  gatewayModel,
  generateDayPlan,
  getPlan,
  keepDish,
  placeDish,
  regenerateMeal,
  savePlan,
  type PlanModel,
} from "@/features/meal-plan/server";

import { dayKind } from "./day-kind";

async function inputFor(iso: string): Promise<PlanInput> {
  const menu = await getMenu(iso);
  const kind = dayKind(iso, menu);
  return {
    date: iso,
    kind,
    // 쉬는 날은 어린이집 식단을 쓰지 않는다.
    daycare: kind === "off" ? null : menu,
    avoid: await listAvoid(),
    resting: await restingNamesFor(iso),
    favorites: await favoriteNamesFor(iso),
  };
}

export function loadPlan(iso: string): Promise<DayPlan | null> {
  return getPlan(iso);
}

// 같은 날짜를 동시에 만들면(화면 두 개, 개발 모드의 이중 실행) 모델은 한 번만 부른다.
const building = new Map<string, Promise<DayPlan>>();

/** 그날 추천이 있으면 그대로 주고, 없으면 만들어 저장한다(가정 A10). */
export function buildPlan(iso: string, model: PlanModel = gatewayModel): Promise<DayPlan> {
  const running = building.get(iso);
  if (running) return running;
  const job = (async () => {
    const saved = await getPlan(iso);
    if (saved) return saved;
    const plan = await generateDayPlan(await inputFor(iso), model);
    // 전날 넉넉히 끓인 국은 다음 날 저녁 국 자리에 한 번 이어 쓴다(가정 A8, AC11).
    const soup = leftoverSoupOf(await getPlan(addDays(iso, -1)));
    if (soup && plan.dinner) plan.dinner = placeDish(plan.dinner, { ...soup, leftover: true });
    await savePlan(iso, plan);
    return plan;
  })().finally(() => building.delete(iso));
  building.set(iso, job);
  return job;
}

async function current(iso: string): Promise<DayPlan> {
  const plan = await getPlan(iso);
  if (!plan) throw new PlanError("바꿀 추천이 아직 없어요");
  return plan;
}

const names = (plan: DayPlan, meal: MealKey) => plan[meal]?.dishes.map((d) => d.name) ?? [];

/** 다른 아침·간식·한 상 보기: 그 끼니 전체만 바꾼다. */
export async function swapMeal(iso: string, meal: MealKey, model: PlanModel = gatewayModel) {
  const plan = await current(iso);
  const hint = `방금 추천한 ${names(plan, meal).join(", ")}와 다른 메뉴로 골라 주세요.`;
  await savePlan(iso, await regenerateMeal(await inputFor(iso), meal, plan, model, hint));
}

/** 이것만 바꾸기: 그 메뉴 하나만 바꾸고 같은 끼니의 나머지는 그대로 둔다. */
export async function swapDish(
  iso: string,
  meal: MealKey,
  index: number,
  model: PlanModel = gatewayModel
) {
  const plan = await current(iso);
  const old = plan[meal]!.dishes;
  const target = old[index];
  if (!target) throw new PlanError("바꿀 메뉴를 찾지 못했어요");
  const others = old.filter((_, i) => i !== index).map((d) => d.name);
  const hint = `"${target.name}"만 다른 메뉴 하나로 바꾸고 나머지(${others.join(", ")})는 그대로 두세요. 같은 자리(국은 국, 반찬은 반찬)의 메뉴로 바꿔 주세요.`;
  const made = await regenerateMeal(await inputFor(iso), meal, plan, model, hint);
  const oldNames = old.map((d) => d.name);
  const fresh = made[meal]!.dishes;
  const replacement =
    fresh[index] && !oldNames.includes(fresh[index].name)
      ? fresh[index]
      : fresh.find((d) => !oldNames.includes(d.name));
  if (!replacement) throw new PlanError("다른 메뉴를 찾지 못했어요");
  const dishes = old.map((d, i) => (i === index ? replacement : d));
  await savePlan(iso, { ...plan, [meal]: { ...plan[meal]!, dishes } });
}

const FILL_MEAL: Record<FoodGroup, MealKey> = {
  곡류: "breakfast",
  "고기·생선·달걀·콩": "dinner",
  채소: "dinner",
  과일: "snack",
  "우유·유제품": "snack",
};

/** 빈 식품군 채우기: 그 식품군이 들어가는 끼니를 그 식품군이 들어간 메뉴로 다시 만든다. */
export async function fillGroup(iso: string, group: FoodGroup, model: PlanModel = gatewayModel) {
  const plan = await current(iso);
  const meal = FILL_MEAL[group] === "breakfast" || plan[FILL_MEAL[group]] ? FILL_MEAL[group] : "dinner";
  const hint = `이 끼니에 ${group} 식품군이 들어간 메뉴를 넣어 주세요. 기존 메뉴(${names(plan, meal).join(", ")})는 필요하면 바꿔도 됩니다.`;
  await savePlan(iso, await regenerateMeal(await inputFor(iso), meal, plan, model, hint));
}

/** 잘 먹은 메뉴를 그날 그 끼니의 해당 칸에 넣는다(AC9). 추천이 없으면 먼저 만든다. */
export async function insertFavorite(
  iso: string,
  meal: MealKey,
  name: string,
  model: PlanModel = gatewayModel
) {
  const plan = await buildPlan(iso, model);
  const dish = await findDishByName(name);
  if (!dish) throw new PlanError("그 메뉴의 레시피를 찾지 못했어요");
  const current = plan[meal];
  if (!current) throw new PlanError("그 끼니는 이날 집에서 먹지 않아요");
  await savePlan(iso, { ...plan, [meal]: placeDish(current, dish) });
}

/** 그날 추천에 있던 메뉴의 레시피를 기억해 둔다. 잘 먹음을 누를 때 쓴다. */
export async function rememberDish(iso: string, name: string): Promise<void> {
  const plan = await getPlan(iso);
  const dish = Object.values(plan ?? {})
    .flatMap((m) => m?.dishes ?? [])
    .find((d) => d.name === name);
  if (dish) await keepDish(dish);
}
