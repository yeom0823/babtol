"use client";

import { useState, useTransition } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import type { FeedbackValue } from "@/features/meal-feedback";
import type { HomeDish, HomeMeal, MealKey } from "@/features/meal-plan";
import { cn } from "@/lib/utils";

import { DishPicture } from "./dish-picture";
import { FeedbackButtons } from "./feedback-buttons";
import { RecipeSheet } from "./recipe-sheet";

export type PlanActions = {
  swapDish: (iso: string, meal: MealKey, index: number) => Promise<{ ok: boolean; busy?: boolean }>;
  swapMeal: (iso: string, meal: MealKey) => Promise<{ ok: boolean; busy?: boolean }>;
  setFeedback: (
    iso: string,
    meal: MealKey,
    name: string,
    value: FeedbackValue | null
  ) => Promise<{ ok: boolean; busy?: boolean }>;
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
  photos,
  actions,
}: {
  iso: string;
  meal: MealKey;
  data: HomeMeal;
  feedback: Record<string, FeedbackValue>;
  /** 메뉴 이름 → 사진 주소. 없으면 사진 자리를 비운 기본 모양을 보여 준다. */
  photos: Record<string, string | null>;
  actions: PlanActions;
}) {
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState<string | null>(null);
  const [failed, setFailed] = useState<"busy" | "error" | null>(null);
  const [recipe, setRecipe] = useState<HomeDish | null>(null);

  const run = (key: string, job: () => Promise<{ ok: boolean; busy?: boolean }>) => {
    setFailed(null);
    setBusy(key);
    startTransition(async () => {
      const result = await job();
      if (!result.ok) setFailed(result.busy ? "busy" : "error");
      setBusy(null);
    });
  };

  const swappable = data.dishes.filter((d) => !d.basic).length > 1;
  // 대표 사진은 사진이 있는 첫 메뉴, 없으면 첫 메뉴(기본 모양).
  const mains = data.dishes.filter((d) => !d.basic);
  const hero = mains.find((d) => photos[d.name]) ?? mains[0];

  return (
    <Card className={cn(pending && "opacity-60 transition-opacity")} aria-busy={pending}>
      <CardContent className="flex flex-col gap-3">
        <DishPicture src={hero ? photos[hero.name] : null} name={hero?.name} className="h-[170px] w-full rounded-[18px] text-6xl" />
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
              className="border-t py-2.5 first:border-t-0 first:pt-0 last:pb-0"
            >
              {dish.basic ? (
                <div className="flex items-center gap-2 text-sm">
                  <Badge variant="secondary">기본</Badge>
                  <span>{dish.name}과 함께 차려 주세요</span>
                </div>
              ) : (
                <div className="flex gap-2.5">
                  <DishPicture src={photos[dish.name]} className="size-11 flex-none rounded-xl text-lg" />
                  <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                    {/* 이름·정보와 레시피·바꾸기를 한 줄에 둔다 */}
                    <div className="flex items-start gap-1">
                      <div className="flex min-w-0 flex-1 flex-col">
                        {dish.leftover && (
                          <span className="text-[11px] font-semibold text-primary">♻️ 어제 저녁에 끓인 국</span>
                        )}
                        <span className="truncate text-[15px] leading-snug font-bold">{dish.name}</span>
                        <span className="truncate text-xs text-muted-foreground">
                          {dish.leftover ? "데우기만 하면 돼요" : `${dish.recipe.minutes}분`}
                          {dish.groups.length ? ` · ${dish.groups.join(", ")}` : ""}
                          {!dish.leftover && dish.recipe.servings > 1 && /(국|찌개|탕)$/.test(dish.name) && meal === "dinner"
                            ? " · ♻️ 내일 저녁까지"
                            : ""}
                        </span>
                      </div>
                      {!dish.leftover && (
                        <Button
                          variant="outline"
                          size="icon-sm"
                          aria-label={`${dish.name} 레시피`}
                          title="레시피"
                          onClick={() => setRecipe(dish)}
                        >
                          📖
                        </Button>
                      )}
                      {(dish.leftover || swappable) && (
                        <Button
                          variant="ghost"
                          size={dish.leftover ? "sm" : "icon-sm"}
                          disabled={pending}
                          aria-label={dish.leftover ? "다 먹었어요, 새 국 고르기" : `${dish.name} 대신 다른 메뉴로 바꾸기`}
                          title={dish.leftover ? "다 먹었어요, 새로 고르기" : "이것만 바꾸기"}
                          onClick={() => run(`dish-${index}`, () => actions.swapDish(iso, meal, index))}
                        >
                          {busy === `dish-${index}` ? <Spinner /> : dish.leftover ? "🍲 새로 고르기" : "🔀"}
                        </Button>
                      )}
                    </div>
                    <FeedbackButtons
                      iso={iso}
                      meal={meal}
                      name={dish.name}
                      initial={feedback[dish.name] ?? null}
                      save={actions.setFeedback}
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <span className="text-xs text-muted-foreground">먹여 봤다면 반응을 눌러 주세요. 안 눌러도 괜찮아요.</span>

        {failed && (
          <p role="alert" className="m-0 text-[13px] text-destructive">
            {failed === "busy"
              ? "지금 AI 사용량이 많아요. 1분쯤 뒤에 다시 눌러 주세요."
              : "지금은 바꾸지 못했어요. 다시 눌러 주세요."}
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
