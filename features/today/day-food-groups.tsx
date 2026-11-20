"use client";

import { ChevronDownIcon } from "lucide-react";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { FOOD_GROUPS, type FoodGroup } from "@/features/meal-plan";

import { FoodGroupChip } from "./food-group-chip";

/**
 * 이날 하루 식품군: 다섯 식품군을 칩 한 줄로 요약한다. 다 채운 날은 이 한 줄만 보이고,
 * 어디서 채웠는지는 펼쳐야 보인다. 빈 식품군이 있으면 그것만 드러내 한 번 눌러 채운다.
 */
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
    <Card size="sm">
      <CardContent className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold">이날 하루 식품군</span>
          <span className={missing.length ? "text-xs font-semibold text-destructive" : "text-xs text-muted-foreground"}>
            {missing.length ? `${missing.length}가지 비었어요` : "다 채웠어요"}
          </span>
        </div>
        <div className="flex flex-wrap gap-1">
          {FOOD_GROUPS.map((g) => (
            <FoodGroupChip key={g} group={g} muted={!sources[g].length} />
          ))}
        </div>

        {missing.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {missing.map((g) => (
              <Button
                key={g}
                variant="secondary"
                size="sm"
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
            ))}
          </div>
        )}
        {failed && (
          <p role="alert" className="m-0 text-[13px] text-destructive">
            지금은 채우지 못했어요. 잠시 뒤에 다시 눌러 주세요.
          </p>
        )}

        <details className="group text-xs text-muted-foreground">
          <summary className="flex cursor-pointer list-none items-center gap-1 [&::-webkit-details-marker]:hidden">
            어디서 채웠는지 보기
            <ChevronDownIcon aria-hidden="true" className="size-3.5 transition-transform group-open:rotate-180" />
          </summary>
          <dl className="m-0 mt-1.5 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
            {FOOD_GROUPS.map((g) => (
              <div key={g} className="contents">
                <dt className="font-semibold text-foreground">{g}</dt>
                <dd className="m-0">{sources[g].length ? sources[g].join(" · ") : "없어요"}</dd>
              </div>
            ))}
          </dl>
          <p className="m-0 mt-1.5">
            {withoutDaycare ? "어린이집 식단 없이 집 끼니만 셌어요." : "어린이집 식단과 집 끼니를 합쳐 셌어요."}
          </p>
        </details>
      </CardContent>
    </Card>
  );
}
