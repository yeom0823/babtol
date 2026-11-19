"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Spinner } from "@/components/ui/spinner";
import { MEAL_KO, type HomeDish, type MealKey } from "@/features/meal-plan";
import { RecipeSheet } from "@/features/today";
import { parseISODate } from "@/lib/date";

export type FavoriteItem = {
  name: string;
  count: number;
  lastDate: string;
  meal: MealKey;
  dish: HomeDish | null;
};

const shortDate = (iso: string) => {
  const d = parseISODate(iso);
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
};

/** 잘 먹은 메뉴: 횟수와 함께 보여 주고, 한 번 눌러 오늘의 그 끼니에 넣는다(AC9). */
export function FavoriteList({
  items,
  insert,
}: {
  items: FavoriteItem[];
  insert: (meal: MealKey, name: string) => Promise<{ ok: boolean }>;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState<string | null>(null);
  const [failed, setFailed] = useState<string | null>(null);
  const [recipe, setRecipe] = useState<HomeDish | null>(null);

  if (!items.length) {
    return (
      <Card>
        <CardContent>
          <Empty className="p-4">
            <EmptyHeader>
              <EmptyMedia variant="icon">😋</EmptyMedia>
              <EmptyTitle>아직 모인 메뉴가 없어요</EmptyTitle>
              <EmptyDescription>
                아이가 잘 먹은 메뉴에 &quot;😋 잘 먹음&quot;을 누르면 여기에 쌓여요.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="flex flex-col">
        {items.map((f) => (
          <div key={f.name} className="flex items-center gap-3 border-t py-3 first:border-t-0 first:pt-0 last:pb-0">
            <div aria-hidden="true" className="grid size-[60px] flex-none place-items-center rounded-2xl bg-muted text-2xl opacity-80">
              🍽️
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <span className="text-base font-bold">{f.name}</span>
              <span className="text-xs text-muted-foreground">
                <span className="font-bold text-primary">😋 {f.count}번</span> · 마지막 {shortDate(f.lastDate)} · {MEAL_KO[f.meal]}
              </span>
              <div className="flex flex-wrap gap-1.5">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={pending}
                  onClick={() => {
                    setFailed(null);
                    setBusy(f.name);
                    startTransition(async () => {
                      const result = await insert(f.meal, f.name);
                      setBusy(null);
                      if (result.ok) router.push("/");
                      else setFailed(f.name);
                    });
                  }}
                >
                  {busy === f.name && <Spinner data-icon="inline-start" />}
                  오늘 {MEAL_KO[f.meal]}에 넣기
                </Button>
                {f.dish && (
                  <Button variant="ghost" size="sm" onClick={() => setRecipe(f.dish)}>
                    📖 레시피
                  </Button>
                )}
              </div>
              {failed === f.name && (
                <p role="alert" className="m-0 text-xs text-destructive">
                  지금은 넣지 못했어요. 오늘 {MEAL_KO[f.meal]}이 집 끼니인지 확인해 주세요.
                </p>
              )}
            </div>
          </div>
        ))}
      </CardContent>
      <RecipeSheet dish={recipe} open={recipe !== null} onOpenChange={(open) => !open && setRecipe(null)} />
    </Card>
  );
}
