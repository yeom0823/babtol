"use client";

import { CheckIcon, ChevronDownIcon } from "lucide-react";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { FOOD_GROUPS, type FoodGroup } from "@/features/meal-plan";

/** 어디서 채웠는지: 눌러야 펼쳐지는 식품군별 출처. */
function Sources({ sources, withoutDaycare }: { sources: Record<FoodGroup, string[]>; withoutDaycare: boolean }) {
  return (
    <>
      <dl className="m-0 mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
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
    </>
  );
}

/**
 * 이날 하루 식품군. 다섯 가지를 다 채운 날은 알릴 것이 없으니 눌러야 펼쳐지는 한 줄만 둔다.
 * 빈 식품군이 있는 날에만 카드로 드러내고, 한 번 눌러 채울 수 있게 한다.
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

  if (!missing.length) {
    return (
      <details
        role="status"
        className="group rounded-2xl border border-emerald-200 bg-emerald-50 px-3.5 py-3 text-xs text-emerald-900/80"
      >
        <summary className="flex cursor-pointer list-none items-center gap-2.5 [&::-webkit-details-marker]:hidden">
          <span className="grid size-7 flex-none place-items-center rounded-full bg-emerald-600 text-white">
            <CheckIcon aria-hidden="true" className="size-4" />
          </span>
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="text-[13px] font-bold text-emerald-900">
              하루 다섯 가지 식품군을 모두 채웠어요
            </span>
            <span>곡류 · 단백질 · 채소 · 과일 · 유제품</span>
          </span>
          <ChevronDownIcon aria-label="어디서 채웠는지 보기" className="size-4 flex-none transition-transform group-open:rotate-180" />
        </summary>
        <div className="mt-1 border-t border-emerald-200 pt-1 [&_dt]:text-emerald-900">
          <Sources sources={sources} withoutDaycare={withoutDaycare} />
        </div>
      </details>
    );
  }

  return (
    <Card size="sm">
      <CardContent className="flex flex-col gap-2">
        <span className="text-sm font-bold">
          이날 {missing.join(", ")}이(가) 비었어요
        </span>
        <span className="text-xs text-muted-foreground">집 끼니에 하나 더해 채울 수 있어요.</span>
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
          <Sources sources={sources} withoutDaycare={withoutDaycare} />
        </details>
      </CardContent>
    </Card>
  );
}
