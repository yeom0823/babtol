"use client";

import { useState, useTransition } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import type { FeedbackValue } from "@/features/meal-feedback";
import type { HomeDish, HomeMeal, MealKey } from "@/features/meal-plan";
import { cn } from "@/lib/utils";

import { FeedbackButtons } from "./feedback-buttons";
import { RecipeSheet } from "./recipe-sheet";

export type PlanActions = {
  swapDish: (iso: string, meal: MealKey, index: number) => Promise<{ ok: boolean }>;
  swapMeal: (iso: string, meal: MealKey) => Promise<{ ok: boolean }>;
  setFeedback: (
    iso: string,
    meal: MealKey,
    name: string,
    value: FeedbackValue | null
  ) => Promise<{ ok: boolean }>;
};

const SWAP_ALL_LABEL: Record<MealKey, string> = {
  breakfast: "다른 아침 보기",
  lunch: "다른 점심 보기",
  snack: "다른 간식 보기",
  dinner: "다른 한 상 보기",
};

/** 집 끼니 한 장: 왜 이 메뉴인지, 메뉴 목록, 레시피, 이것만 바꾸기, 끼니 전체 다시 고르기. */
export function HomeMealCard({
  iso,
  meal,
  data,
  feedback,
  actions,
}: {
  iso: string;
  meal: MealKey;
  data: HomeMeal;
  feedback: Record<string, FeedbackValue>;
  actions: PlanActions;
}) {
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [recipe, setRecipe] = useState<HomeDish | null>(null);

  const run = (key: string, job: () => Promise<{ ok: boolean }>) => {
    setFailed(false);
    setBusy(key);
    startTransition(async () => {
      const result = await job();
      if (!result.ok) setFailed(true);
      setBusy(null);
    });
  };

  const swappable = data.dishes.filter((d) => !d.basic).length > 1;

  return (
    <Card className={cn(pending && "opacity-60 transition-opacity")} aria-busy={pending}>
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-start gap-1.5 rounded-xl bg-primary/8 px-2.5 py-2 text-[13px] text-primary">
          <span>💡</span>
          <span>
            {data.dishes.some((d) => d.leftover) && "어제 끓인 국이 남아서 오늘은 반찬만 새로 만들면 돼요. "}
            {data.why}
          </span>
        </div>

        <div className="flex flex-col">
          {data.dishes.map((dish, index) => (
            <div
              key={`${dish.name}-${index}`}
              className="flex flex-col gap-2 border-t py-3 first:border-t-0 first:pt-0"
            >
              {dish.basic ? (
                <div className="flex items-center gap-2 text-sm">
                  <Badge variant="secondary">기본</Badge>
                  <span>{dish.name}과 함께 차려 주세요</span>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div
                    aria-hidden="true"
                    className="grid size-[60px] flex-none place-items-center rounded-2xl bg-muted text-2xl opacity-80"
                  >
                    🍽️
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    {dish.leftover && (
                      <span>
                        <Badge variant="secondary" className="bg-primary/12 text-primary">
                          ♻️ 어제 저녁에 끓인 국
                        </Badge>
                      </span>
                    )}
                    <span className="text-base font-bold">{dish.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {dish.leftover ? "데우기만 하면 돼요" : `${dish.recipe.minutes}분`}
                      {dish.groups.length ? ` · ${dish.groups.join(", ")}` : ""}
                    </span>
                    {!dish.leftover && dish.recipe.servings > 1 && /(국|찌개|탕)$/.test(dish.name) && meal === "dinner" && (
                      <span className="text-xs text-primary">♻️ 넉넉히 끓이면 내일 저녁엔 데우기만 해요</span>
                    )}
                    <div className="flex flex-wrap gap-1.5">
                      {dish.leftover ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={pending}
                          onClick={() => run(`dish-${index}`, () => actions.swapDish(iso, meal, index))}
                        >
                          {busy === `dish-${index}` ? <Spinner data-icon="inline-start" /> : "🍲"} 다 먹었어요, 새로 고르기
                        </Button>
                      ) : (
                        <Button variant="outline" size="sm" onClick={() => setRecipe(dish)}>
                          📖 레시피
                        </Button>
                      )}
                      {swappable && !dish.leftover && (
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={pending}
                          aria-label={`${dish.name} 대신 다른 메뉴로 바꾸기`}
                          onClick={() => run(`dish-${index}`, () => actions.swapDish(iso, meal, index))}
                        >
                          {busy === `dish-${index}` ? <Spinner data-icon="inline-start" /> : "🔀"} 이것만 바꾸기
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )}
              {!dish.basic && (
                <FeedbackButtons
                  iso={iso}
                  meal={meal}
                  name={dish.name}
                  initial={feedback[dish.name] ?? null}
                  save={actions.setFeedback}
                />
              )}
            </div>
          ))}
        </div>

        <span className="text-xs text-muted-foreground">먹여 봤다면 반응을 눌러 주세요. 안 눌러도 괜찮아요.</span>

        {failed && (
          <p role="alert" className="m-0 text-[13px] text-destructive">
            지금은 바꾸지 못했어요. 잠시 뒤에 다시 눌러 주세요.
          </p>
        )}

        <Button
          variant="secondary"
          className="w-full"
          disabled={pending}
          onClick={() => run("all", () => actions.swapMeal(iso, meal))}
        >
          {busy === "all" ? <Spinner data-icon="inline-start" /> : "🔀"}
          {busy === "all" ? "다시 고르는 중" : SWAP_ALL_LABEL[meal]}
        </Button>
      </CardContent>

      <RecipeSheet dish={recipe} open={recipe !== null} onOpenChange={(open) => !open && setRecipe(null)} />
    </Card>
  );
}
