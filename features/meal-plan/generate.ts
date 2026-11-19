import { generateText } from "ai";
import { z } from "zod";

import { mainIngredientsOf } from "./food-groups";
import { dayCoverage } from "./day-coverage";
import { extractJson } from "./extract-json";
import { MEAL_KO, SYSTEM, buildPrompt, mealsFor, type PlanInput } from "./prompt";
import { mealSchema } from "./schema";
import type { DayPlan, MealKey } from "./types";
import { findViolations } from "./violations";

/** AI Gateway의 무료 텍스트 모델. 모델 ID와 무료 여부는 작업할 때 모델 목록에서 다시 확인한다. */
export const MODEL_ID = "nvidia/nemotron-3.5-lightning-free";

export class PlanError extends Error {}

export type PlanModel = (prompt: {
  system: string;
  user: string;
  schema?: z.ZodType;
}) => Promise<unknown>;

/**
 * 무료 모델은 게이트웨이가 JSON 스키마를 강제하지 않는다(responseFormat 미지원). 그래서 프롬프트의 예시로
 * 형식을 알려 주고, 답에서 JSON을 꺼내 우리 스키마로 직접 검증한다. 인증은 Vercel OIDC 토큰이 맡는다.
 */
export const gatewayModel: PlanModel = async ({ system, user }) => {
  const { text } = await generateText({
    model: MODEL_ID,
    system,
    prompt: user,
    abortSignal: AbortSignal.timeout(170_000),
    maxRetries: 1,
  });
  return extractJson(text);
};

const MAX_ATTEMPTS = 3;

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
  let candidate: DayPlan | null = null;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const raw = await model({
      system: SYSTEM,
      user: buildPrompt(input, meals, feedback, keepNames, hint),
      schema,
    }).catch(() => null);
    const parsed = schema.safeParse(raw);
    if (!parsed.success) {
      feedback = ["JSON 형식이 지정한 구조와 달랐어요. 모든 끼니의 why와 dishes, 레시피 필드를 채워 주세요."];
      continue;
    }
    const plan = parsed.data as DayPlan;
    const hard = findViolations(plan, ctx).map(
      (v) => `${MEAL_KO[v.meal]} ${v.dish}: ${v.detail}`
    );
    if (hard.length) {
      feedback = hard;
      lastHard = hard;
      continue;
    }
    candidate = plan;
    lastHard = [];
    // 식품군은 하루 전체를 만들 때만 따진다.
    if (keep || meals.length < 3) return plan;
    const { missing } = dayCoverage(plan, input.daycare);
    if (!missing.length) return plan;
    feedback = [`식품군 ${missing.join(", ")}이(가) 하루 안에 비었어요. 집 끼니에서 채워 주세요.`];
  }
  if (candidate && !lastHard.length) return candidate;
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

