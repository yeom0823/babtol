import { z } from "zod";

import { ModelBusyError, gatewayModel, type JsonModel } from "@/lib/llm";

import { mainIngredientsOf } from "./food-groups";
import { dayCoverage } from "./day-coverage";
import { MEAL_KO, SYSTEM, buildPrompt, mealsFor, type PlanInput } from "./prompt";
import { mealSchema } from "./schema";
import type { DayPlan, MealKey } from "./types";
import { findViolations } from "./violations";

export { gatewayModel };

export class PlanError extends Error {}

/** AI 호출 한도에 걸려 지금은 만들 수 없다. 1분쯤 뒤에 다시 하면 된다. */
export class PlanBusyError extends PlanError {}

export type PlanModel = JsonModel;

// JSON 모드로 받아 형식 실패는 드물다. 재시도는 대부분 규칙 위반 때문이고, 한도(분당 5회)를 아끼려고 4번까지만 한다.
const MAX_ATTEMPTS = 4;

function daycareText(input: PlanInput): string {
  const d = input.daycare;
  return d ? [...d.lunch, ...d.morningSnack, ...d.afternoonSnack].join(" ") : "";
}

/**
 * 지정한 끼니를 만든다. 어린이집과 겹치거나, 피할 음식·쉬는 메뉴가 들어가거나, 아이 안전 규칙을
 * 어기면 어긴 곳을 알려 주고 다시 받는다. 하드 규칙이 끝까지 남으면 내보내지 않고 실패한다.
 * 식품군이 비는 것은 다시 받아 보되, 끝내 비면 그대로 내보낸다(AC15는 95% 기준).
 */
async function generateMeals(
  input: PlanInput,
  meals: MealKey[],
  model: PlanModel,
  keep?: DayPlan,
  hint?: string
): Promise<DayPlan> {
  const schema = z.object(Object.fromEntries(meals.map((m) => [m, mealSchema])));
  const ctx = {
    daycareIngredients: mainIngredientsOf(daycareText(input)),
    avoid: input.avoid,
    resting: input.resting,
  };
  const keepNames = keep
    ? Object.fromEntries(
        Object.entries(keep).map(([m, v]) => [m, v!.dishes.map((d) => d.name)])
      )
    : undefined;

  let feedback: string[] = [];
  let lastHard: string[] = [];
  let candidate: { plan: DayPlan; missing: number } | null = null;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const t0 = Date.now();
    let raw: unknown = null;
    try {
      raw = await model({ system: SYSTEM, user: buildPrompt(input, meals, feedback, keepNames, hint) });
    } catch (e) {
      // 한도에 걸리면 1분 동안은 다시 불러도 실패만 쌓인다. 남은 시도를 쓰지 않고 바로 멈춘다.
      if (e instanceof ModelBusyError) {
        if (candidate) return candidate.plan;
        throw new PlanBusyError("지금 AI 사용량이 많아요");
      }
      console.info(`[meal-plan] attempt ${attempt} call error:`, e instanceof Error ? e.message : e);
    }
    const parsed = schema.safeParse(raw);
    console.info(`[meal-plan] attempt ${attempt} ${meals.join(",")} ${Date.now() - t0}ms ${parsed.success ? "parsed" : "invalid"}`);
    if (!parsed.success) {
      feedback = ["JSON 형식이 지정한 구조와 달랐어요. 모든 끼니의 why와 dishes, 레시피 필드를 채워 주세요."];
      continue;
    }
    const plan = parsed.data as DayPlan;
    const hard = findViolations(plan, ctx).map(
      (v) => `${MEAL_KO[v.meal]} ${v.dish}: ${v.detail}`
    );
    if (hard.length) {
      console.info(`[meal-plan] attempt ${attempt} violations:`, hard.join(" | "));
      feedback = hard;
      lastHard = hard;
      continue;
    }
    lastHard = [];
    // 식품군은 하루 전체를 만들 때만 따진다.
    if (keep || meals.length < 3) return plan;
    const { missing } = dayCoverage(plan, input.daycare);
    if (!missing.length) return plan;
    // 식품군 보완은 한 번만 다시 받는다. 빈 칸은 화면의 "채우기"로도 메울 수 있다(AC15는 95% 기준).
    if (candidate) return missing.length < candidate.missing ? plan : candidate.plan;
    candidate = { plan, missing: missing.length };
    feedback = [`식품군 ${missing.join(", ")}이(가) 하루 안에 비었어요. 집 끼니에서 채워 주세요.`];
  }
  // 규칙을 지킨 추천이 한 번이라도 있었으면, 식품군을 채우려던 뒤 시도가 실패해도 그 추천을 쓴다.
  if (candidate) return candidate.plan;
  throw new PlanError(lastHard.length ? `규칙을 지키는 추천을 만들지 못했어요: ${lastHard[0]}` : "추천을 만들지 못했어요");
}

/** 하루치(아침·간식·저녁, 쉬는 날은 점심 포함) 추천을 만든다. */
export function generateDayPlan(input: PlanInput, model: PlanModel = gatewayModel): Promise<DayPlan> {
  return generateMeals(input, mealsFor(input.kind), model);
}

/** 끼니 하나만 다시 만든다. 나머지 끼니와 겹치지 않고 식품군을 보완하게 한다. */
export async function regenerateMeal(
  input: PlanInput,
  meal: MealKey,
  current: DayPlan,
  model: PlanModel = gatewayModel,
  hint?: string
): Promise<DayPlan> {
  const others = Object.fromEntries(Object.entries(current).filter(([m]) => m !== meal)) as DayPlan;
  const made = await generateMeals(input, [meal], model, others, hint);
  return { ...current, ...made };
}

