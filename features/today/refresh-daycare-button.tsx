"use client";

import { RefreshCwIcon } from "lucide-react";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * 키즈노트에서 식단과 사진을 바로 다시 가져오는 작은 버튼. 선생님이 사진을 방금 올렸을 때 쓴다.
 * 키즈노트에 요청이 몰리지 않게 서버가 5분 간격을 지키고, 그 안에 누르면 안내만 한다.
 */
export function RefreshDaycareButton({ refresh }: { refresh: () => Promise<{ ok: boolean; recent?: boolean }> }) {
  const [pending, startTransition] = useTransition();
  const [note, setNote] = useState<{ text: string; error: boolean } | null>(null);
  return (
    <div className="flex flex-wrap items-center gap-x-2">
      <Button
        variant="ghost"
        size="sm"
        className="-ml-2 text-muted-foreground"
        disabled={pending}
        onClick={() => {
          setNote(null);
          startTransition(async () => {
            const result = await refresh();
            if (result.recent) setNote({ text: "방금 가져왔어요. 5분 뒤에 다시 눌러 주세요.", error: false });
            else if (!result.ok) setNote({ text: "지금은 가져오지 못했어요.", error: true });
          });
        }}
      >
        <RefreshCwIcon data-icon="inline-start" className={cn(pending && "animate-spin")} />
        {pending ? "가져오는 중" : "키즈노트에서 새로 가져오기"}
      </Button>
      {note && (
        <span role={note.error ? "alert" : "status"} className={cn("text-xs", note.error ? "text-destructive" : "text-muted-foreground")}>
          {note.text}
        </span>
      )}
    </div>
  );
}
