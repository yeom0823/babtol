"use client";

import { RefreshCwIcon } from "lucide-react";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** 키즈노트에서 식단과 사진을 바로 다시 가져오는 작은 버튼. 선생님이 사진을 방금 올렸을 때 쓴다. */
export function RefreshDaycareButton({ refresh }: { refresh: () => Promise<{ ok: boolean }> }) {
  const [pending, startTransition] = useTransition();
  const [failed, setFailed] = useState(false);
  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="sm"
        className="-ml-2 text-muted-foreground"
        disabled={pending}
        onClick={() => {
          setFailed(false);
          startTransition(async () => {
            const result = await refresh();
            if (!result.ok) setFailed(true);
          });
        }}
      >
        <RefreshCwIcon data-icon="inline-start" className={cn(pending && "animate-spin")} />
        {pending ? "가져오는 중" : "키즈노트에서 새로 가져오기"}
      </Button>
      {failed && (
        <span role="alert" className="text-xs text-destructive">
          지금은 가져오지 못했어요
        </span>
      )}
    </div>
  );
}
