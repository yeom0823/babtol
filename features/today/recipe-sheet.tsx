"use client";

import type { ReactNode } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import type { HomeDish } from "@/features/meal-plan";

import { DishPicture } from "./dish-picture";

// 제목에 이미 "두 돌 아이에게 줄 때"가 있어서 모델이 문장 앞에 되풀이한 것은 뺀다.
const stripLead = (note: string) => note.replace(/^\s*두 돌 아이에게 줄 때\s*[:：,]?\s*/, "");

/**
 * 메뉴 한 가지의 자세한 화면: 사진, 바꾸기·먹은 반응 같은 할 일(actions),
 * 레시피(재료와 분량, 순서, "두 돌 아이에게 줄 때" 주의)를 보여 준다.
 */
export function RecipeSheet({
  dish,
  open,
  onOpenChange,
  photo,
  actions,
}: {
  dish: HomeDish | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  photo?: string | null;
  actions?: ReactNode;
}) {
  // 남은 국은 데우기만 하면 되니 레시피를 숨긴다.
  const showRecipe = dish && !dish.leftover;
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="mx-auto max-h-[86dvh] max-w-[560px] overflow-y-auto rounded-t-3xl p-5">
        {dish && (
          <>
            {photo && <DishPicture src={photo} name={dish.name} className="h-[150px] w-full flex-none rounded-2xl" />}
            <SheetHeader className="p-0">
              <SheetTitle className="text-[19px] font-bold">{dish.name}</SheetTitle>
              <SheetDescription>
                {dish.leftover
                  ? "어제 저녁에 끓인 국 · 데우기만 하면 돼요"
                  : `${dish.recipe.minutes}분 · ${dish.recipe.servings > 1 ? `${dish.recipe.servings}회 분량` : "1회 분량"}`}
              </SheetDescription>
            </SheetHeader>
            {dish.groups.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {dish.groups.map((g) => (
                  <Badge key={g} variant="secondary">
                    {g}
                  </Badge>
                ))}
              </div>
            )}
            {actions}
            {showRecipe && (
              <>
                <Separator />
                <section className="flex flex-col gap-2">
                  <h3 className="text-[15px] font-bold">재료</h3>
                  <ul className="m-0 grid list-none grid-cols-[1fr_auto] gap-x-3 gap-y-1.5 p-0 text-sm">
                    {dish.recipe.ingredients.map((ing, i) => (
                      <li key={i} className="contents">
                        <span>{ing.name}</span>
                        <span className="text-muted-foreground">{ing.amount}</span>
                      </li>
                    ))}
                  </ul>
                </section>
                <Separator />
                <section className="flex flex-col gap-2">
                  <h3 className="text-[15px] font-bold">만드는 순서</h3>
                  <ol className="m-0 flex list-decimal flex-col gap-2 pl-5 text-sm">
                    {dish.recipe.steps.map((step, i) => (
                      <li key={i}>{step}</li>
                    ))}
                  </ol>
                </section>
                <Alert>
                  <AlertTitle>👶 두 돌 아이에게 줄 때</AlertTitle>
                  <AlertDescription>{stripLead(dish.recipe.kidNote)}</AlertDescription>
                </Alert>
              </>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
