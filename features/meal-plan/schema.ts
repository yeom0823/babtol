import { z } from "zod";

import { FOOD_GROUPS } from "./food-groups";

/**
 * 무료 모델은 게이트웨이가 JSON 스키마를 강제하지 않아 형식이 조금씩 어긋난다.
 * 흔한 어긋남(kidNote를 recipe 밖에 씀, 정해진 값이 아닌 식품군, 숫자·글 혼동)은 받아 주고,
 * 아이 주의(kidNote)처럼 빠지면 안 되는 것은 끝까지 요구한다.
 */
function normalizeDish(raw: unknown): unknown {
  if (!raw || typeof raw !== "object") return raw;
  const dish = { ...(raw as Record<string, unknown>) };
  const recipe = { ...((dish.recipe as Record<string, unknown> | undefined) ?? {}) };
  if (recipe.kidNote == null) recipe.kidNote = dish.kidNote ?? dish.kid_note;
  dish.recipe = recipe;
  delete dish.kidNote;
  delete dish.kid_note;
  if (Array.isArray(dish.groups)) {
    dish.groups = dish.groups.filter((g) => (FOOD_GROUPS as readonly unknown[]).includes(g));
  } else {
    dish.groups = [];
  }
  return dish;
}

const dishSchema = z.preprocess(
  normalizeDish,
  z.object({
    name: z.string().min(1),
    groups: z.array(z.enum(FOOD_GROUPS)),
    mainIngredients: z.array(z.string()).catch([]),
    basic: z.boolean().optional().catch(undefined),
    recipe: z.object({
      minutes: z.coerce.number(),
      servings: z.coerce.number().catch(1),
      ingredients: z.array(z.object({ name: z.string(), amount: z.coerce.string() })),
      steps: z.array(z.string()),
      kidNote: z.string(),
    }),
  })
);

export const mealSchema = z.object({ why: z.string(), dishes: z.array(dishSchema).min(1) });
