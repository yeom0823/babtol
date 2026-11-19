"use client";

import { useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { parseISODate } from "@/lib/date";

const shortDate = (iso: string) => {
  const d = parseISODate(iso);
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
};

/** 잠깐 쉬는 메뉴: 언제까지 쉬는지 보여 주고, 다시 추천받게 되돌린다(AC8). */
export function RestingList({
  items,
  release,
}: {
  items: { name: string; until: string }[];
  release: (name: string) => Promise<{ ok: boolean }>;
}) {
  const [pending, startTransition] = useTransition();
  if (!items.length) return null;
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-[15px] font-bold">잠깐 쉬는 메뉴</h2>
      <p className="-mt-1 m-0 text-xs text-muted-foreground">
        &quot;남김&quot;을 누른 메뉴는 2주 동안 추천하지 않아요.
      </p>
      <Card>
        <CardContent className="flex flex-col">
          {items.map((r) => (
            <div key={r.name} className="flex items-center justify-between gap-2 border-t py-2.5 first:border-t-0 first:pt-0 last:pb-0">
              <span className="flex flex-col">
                <span className="font-semibold">😣 {r.name}</span>
                <span className="text-xs text-muted-foreground">{shortDate(r.until)}까지 추천하지 않아요</span>
              </span>
              <Button
                variant="ghost"
                size="sm"
                disabled={pending}
                onClick={() => startTransition(async () => void (await release(r.name)))}
              >
                다시 추천받기
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </section>
  );
}
