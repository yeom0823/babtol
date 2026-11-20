"use client";

import { LayoutGridIcon, ListIcon, RefreshCwIcon } from "lucide-react";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import type { FeedbackValue } from "@/features/meal-feedback";
import type { HomeDish, HomeMeal, MealKey } from "@/features/meal-plan";
import { cn } from "@/lib/utils";

import { DishPicture } from "./dish-picture";
import { FeedbackButtons } from "./feedback-buttons";
import { RecipeSheet } from "./recipe-sheet";
import { useDishLayout } from "./use-dish-layout";

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
  breakfast: "다른 아침",
  lunch: "다른 점심",
  snack: "다른 간식",
  dinner: "다른 한 상",
};

const isSoup = (name: string) => /(국|찌개|탕)$/.test(name);

/**
 * 집 끼니 한 장: 왜 이 메뉴인지와 메뉴 목록. 메뉴는 한 줄 목록이나 2열 타일로 볼 수 있다.
 * 먹은 반응은 목록에서 바로 누르고, 메뉴를 누르면 시트에서 레시피와 이것만 바꾸기를 다룬다.
 */
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
  const [opened, setOpened] = useState<number | null>(null);
  // 마지막으로 누른 반응의 안내 문장. 버튼 옆이 좁아 메뉴 줄 아래에 띄운다.
  const [notice, setNotice] = useState<{ index: number; text: string } | null>(null);
  const [layout, setLayout] = useDishLayout();

  const run = (key: string, job: () => Promise<{ ok: boolean; busy?: boolean }>) => {
    setFailed(null);
    setBusy(key);
    startTransition(async () => {
      const result = await job();
      if (!result.ok) setFailed(result.busy ? "busy" : "error");
      setBusy(null);
    });
  };

  const basics = data.dishes.filter((d) => d.basic);
  const mains = data.dishes.map((dish, index) => ({ dish, index })).filter(({ dish }) => !dish.basic);
  const swappable = mains.length > 1;
  // 목록 보기에서만, 실제 사진이 있을 때만 대표 사진을 크게 보여 준다.
  const hero = layout === "list" ? mains.find(({ dish }) => photos[dish.name])?.dish : undefined;
  const openedDish = opened === null ? null : (data.dishes[opened] ?? null);

  // 조리 시간과 주재료(없으면 레시피 앞쪽 재료). 무엇으로 만드는지 목록에서 바로 보이게 한다.
  const meta = (dish: HomeDish) => {
    const stuff = dish.mainIngredients.length
      ? dish.mainIngredients
      : dish.recipe.ingredients.slice(0, 2).map((i) => i.name);
    return [
      dish.leftover ? "어제 끓인 국, 데우기만" : `${dish.recipe.minutes}분`,
      stuff.slice(0, 3).join(", ") || null,
      !dish.leftover && dish.recipe.servings > 1 && isSoup(dish.name) && meal === "dinner" ? "♻️ 내일까지" : null,
    ]
      .filter(Boolean)
      .join(" · ");
  };

  const reactions = (dish: HomeDish, index: number) =>
    busy === `dish-${index}` ? (
      <span className="grid h-8 w-[100px] flex-none place-items-center">
        <Spinner />
      </span>
    ) : (
      <FeedbackButtons
        iso={iso}
        meal={meal}
        name={dish.name}
        initial={feedback[dish.name] ?? null}
        save={actions.setFeedback}
        onMessage={(text) => setNotice(text ? { index, text } : null)}
      />
    );

  const noticeFor = (index: number) =>
    notice?.index === index && (
      <p role="status" className="m-0 pb-2 text-xs text-muted-foreground">
        {notice.text}
      </p>
    );

  return (
    <Card className={cn(pending && "opacity-60 transition-opacity")} aria-busy={pending}>
      <CardContent className="flex flex-col gap-3">
        {hero && (
          <DishPicture src={photos[hero.name]} name={hero.name} className="h-[170px] w-full rounded-[18px] text-6xl" />
        )}
        <div className="flex items-start gap-1.5 rounded-xl bg-primary/8 px-2.5 py-2 text-[13px] text-primary">
          <span>💡</span>
          <span>
            {data.dishes.some((d) => d.leftover) && "어제 끓인 국이 남아서 오늘은 반찬만 새로 만들면 돼요. "}
            {data.why}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <div className="flex min-w-0 flex-1 flex-wrap gap-1">
            {basics.map((b) => (
              <span key={b.name} className="truncate rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                {b.name}과 함께
              </span>
            ))}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="flex-none text-muted-foreground"
            disabled={pending}
            onClick={() => run("all", () => actions.swapMeal(iso, meal))}
          >
            {busy === "all" ? <Spinner data-icon="inline-start" /> : <RefreshCwIcon data-icon="inline-start" />}
            {busy === "all" ? "고르는 중" : SWAP_ALL_LABEL[meal]}
          </Button>
          <div role="group" aria-label="메뉴 보기 방식" className="flex flex-none rounded-full bg-muted p-0.5">
            {(
              [
                ["list", "목록으로 보기", ListIcon],
                ["grid", "사진 타일로 보기", LayoutGridIcon],
              ] as const
            ).map(([value, label, Icon]) => (
              <button
                key={value}
                type="button"
                aria-label={label}
                aria-pressed={layout === value}
                onClick={() => setLayout(value)}
                className={cn(
                  "grid size-7 place-items-center rounded-full text-muted-foreground",
                  layout === value && "bg-background text-foreground shadow-xs"
                )}
              >
                <Icon className="size-4" />
              </button>
            ))}
          </div>
        </div>

        {layout === "list" ? (
          <ul className="m-0 flex list-none flex-col p-0">
            {mains.map(({ dish, index }) => (
              <li key={`${dish.name}-${index}`} className="border-t first:border-t-0">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setOpened(index)}
                    aria-label={`${dish.name} 레시피 보기`}
                    className="flex min-w-0 flex-1 items-center gap-3 py-2.5 text-left"
                  >
                    <DishPicture src={photos[dish.name]} className="size-12 flex-none rounded-xl text-lg" />
                    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="truncate text-[15px] leading-snug font-bold">{dish.name}</span>
                      <span className="truncate text-[13px] text-muted-foreground">{meta(dish)}</span>
                    </span>
                  </button>
                  {reactions(dish, index)}
                </div>
                {noticeFor(index)}
              </li>
            ))}
          </ul>
        ) : (
          <ul className="m-0 grid list-none grid-cols-2 gap-x-2.5 gap-y-3 p-0">
            {mains.map(({ dish, index }) => (
              <li key={`${dish.name}-${index}`} className="flex flex-col gap-1">
                <button
                  type="button"
                  onClick={() => setOpened(index)}
                  aria-label={`${dish.name} 레시피 보기`}
                  className="flex w-full flex-col gap-1 text-left"
                >
                  <DishPicture src={photos[dish.name]} className="aspect-[4/3] w-full rounded-xl text-3xl" />
                  <span className="truncate text-sm leading-snug font-bold">{dish.name}</span>
                  <span className="truncate text-xs text-muted-foreground">{meta(dish)}</span>
                </button>
                {reactions(dish, index)}
                {noticeFor(index)}
              </li>
            ))}
          </ul>
        )}

        {failed && (
          <p role="alert" className="m-0 text-[13px] text-destructive">
            {failed === "busy"
              ? "지금 AI 사용량이 많아요. 1분쯤 뒤에 다시 눌러 주세요."
              : "지금은 바꾸지 못했어요. 다시 눌러 주세요."}
          </p>
        )}
      </CardContent>

      <RecipeSheet
        dish={openedDish}
        open={openedDish !== null}
        onOpenChange={(open) => !open && setOpened(null)}
        photo={openedDish ? photos[openedDish.name] : null}
        actions={
          openedDish &&
          opened !== null &&
          (openedDish.leftover || swappable) && (
            <Button
              variant="outline"
              disabled={pending}
              onClick={() => {
                const index = opened;
                setOpened(null);
                run(`dish-${index}`, () => actions.swapDish(iso, meal, index));
              }}
            >
              <RefreshCwIcon data-icon="inline-start" />
              {openedDish.leftover ? "다 먹었어요, 새 국 고르기" : "이것만 다른 메뉴로 바꾸기"}
            </Button>
          )
        }
      />
    </Card>
  );
}
