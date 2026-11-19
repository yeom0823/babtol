"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Progress } from "@/components/ui/progress";
import { shoppingText, type ShoppingList } from "@/features/shopping";
import { cn } from "@/lib/utils";

/** 장보기 목록: 집에 있는 재료는 체크해서 지우고, 남은 재료는 복사해서 보낸다(AC12). */
export function ShoppingView({ list, label }: { list: ShoppingList; label: string }) {
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState<string | null>(null);
  const items = list.groups.flatMap((g) => g.items);
  const left = items.filter((i) => !checked.has(i.name)).length;
  const allDone = items.length > 0 && left === 0;

  const toggle = (name: string) =>
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(shoppingText(list, checked, label));
      setCopied("남은 재료 목록을 복사했어요. 카톡에 붙여 넣어 보내세요");
    } catch {
      setCopied("복사하지 못했어요. 다시 눌러 주세요");
    }
  };

  return (
    <>
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold">
            살 것 {left}개 / 전체 {items.length}개
          </span>
          <span className="text-xs text-muted-foreground">집 끼니 {list.meals}번 기준</span>
        </div>
        <Progress value={items.length ? ((items.length - left) / items.length) * 100 : 0} aria-label="챙긴 재료" />
      </div>

      {allDone ? (
        <Card>
          <CardContent>
            <Empty className="p-4">
              <EmptyHeader>
                <EmptyMedia variant="icon">🎉</EmptyMedia>
                <EmptyTitle>다 챙겼어요</EmptyTitle>
                <EmptyDescription>장 볼 재료가 남지 않았어요.</EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button variant="ghost" size="sm" onClick={() => setChecked(new Set())}>
                  목록 다시 보기
                </Button>
              </EmptyContent>
            </Empty>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex flex-col gap-4">
            {list.groups.map((group) => (
              <section key={group.category} className="flex flex-col">
                <h2 className="mb-0.5 text-[13px] font-bold text-muted-foreground">{group.category}</h2>
                {group.items.map((item) => {
                  const got = checked.has(item.name);
                  return (
                    <label
                      key={item.name}
                      className="grid cursor-pointer grid-cols-[24px_1fr_auto] items-center gap-2.5 border-t py-2.5 first-of-type:border-t-0"
                    >
                      <Checkbox checked={got} onCheckedChange={() => toggle(item.name)} />
                      <span className="flex flex-col">
                        <span className={cn("text-[15px] font-semibold", got && "font-medium text-muted-foreground line-through")}>
                          {item.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {item.uses.slice(0, 2).join(", ")}
                          {item.uses.length > 2 ? ` 외 ${item.uses.length - 2}개` : ""}
                        </span>
                      </span>
                      <span className="text-right text-[13px] text-muted-foreground">
                        {item.uses.length > 1 ? `${item.uses.length}번 써요` : item.amount}
                      </span>
                    </label>
                  );
                })}
              </section>
            ))}
          </CardContent>
        </Card>
      )}

      <span className="text-xs text-muted-foreground">
        간장, 참기름, 된장, 밥처럼 집에 늘 있는 재료는 뺐어요.
      </span>
      <Button variant="outline" className="w-full" onClick={copy} disabled={!items.length}>
        📋 남은 재료 복사해서 보내기
      </Button>
      {copied && (
        <p role="status" className="m-0 text-center text-[13px] text-muted-foreground">
          {copied}
        </p>
      )}
    </>
  );
}
