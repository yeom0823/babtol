"use client";

import { useState, useTransition } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { FOOD_GROUPS, type FoodGroup } from "@/features/meal-plan";
import { cn } from "@/lib/utils";

/** 이날 하루 식품군: 다섯 식품군마다 어디서 채웠는지 보여 주고, 빈 곳은 한 번 눌러 채운다. */
export function DayFoodGroups({
  iso,
  sources,
  withoutDaycare,
  fill,
}: {
  iso: string;
  sources: Record<FoodGroup, string[]>;
  withoutDaycare: boolean;
  fill: (iso: string, group: FoodGroup) => Promise<{ ok: boolean }>;
}) {
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState<FoodGroup | null>(null);
  const [failed, setFailed] = useState(false);
  const missing = FOOD_GROUPS.filter((g) => !sources[g].length);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-[15px] font-bold">이날 하루 식품군</CardTitle>
        <CardDescription>
          {withoutDaycare ? "어린이집 식단 없이 집 끼니만 셌어요" : "어린이집 식단과 집 끼니를 합쳤어요"}
        </CardDescription>
        <Badge variant={missing.length ? "secondary" : "default"} className="col-start-2 row-span-2 row-start-1 justify-self-end">
          {missing.length ? `${missing.length}가지 비었어요` : "5가지 다 채웠어요"}
        </Badge>
      </CardHeader>
      <CardContent className="flex flex-col">
        {FOOD_GROUPS.map((g) => {
          const filled = sources[g].length > 0;
          return (
            <div key={g} className="grid grid-cols-[26px_1fr] items-center gap-2.5 border-t py-2 first:border-t-0">
              <span
                aria-hidden="true"
                className={cn(
                  "grid size-6 place-items-center rounded-full text-xs font-bold",
                  filled
                    ? "bg-primary text-primary-foreground"
                    : "border-[1.5px] border-dashed border-destructive text-destructive"
                )}
              >
                {filled ? "✓" : "!"}
              </span>
              <span className="flex flex-col">
                <span className="text-sm font-semibold">{g}</span>
                <span className={cn("text-xs", filled ? "text-muted-foreground" : "text-destructive")}>
                  {filled ? sources[g].join(" · ") : "오늘 끼니에 없어요"}
                </span>
              </span>
              {!filled && (
                <Button
                  variant="secondary"
                  size="sm"
                  className="col-start-2 justify-self-start"
                  disabled={pending}
                  onClick={() => {
                    setFailed(false);
                    setBusy(g);
                    startTransition(async () => {
                      const result = await fill(iso, g);
                      if (!result.ok) setFailed(true);
                      setBusy(null);
                    });
                  }}
                >
                  {busy === g && <Spinner data-icon="inline-start" />}
                  {g} 채우기
                </Button>
              )}
            </div>
          );
        })}
        {failed && (
          <p role="alert" className="m-0 pt-2 text-[13px] text-destructive">
            지금은 채우지 못했어요. 잠시 뒤에 다시 눌러 주세요.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
