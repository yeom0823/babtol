"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";

export function JoinButton({
  join,
}: {
  join: () => Promise<{ failed: boolean; already?: boolean }>;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="flex flex-col gap-2">
      <Button
        size="lg"
        className="h-11 w-full rounded-full text-[15px]"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await join();
            if (result.failed)
              setError(result.already ? "이미 다른 가족에 들어가 있어요." : "들어가지 못했어요. 링크를 다시 받아 주세요.");
          })
        }
      >
        {pending ? "들어가는 중" : "가족으로 들어가기"}
      </Button>
      {error && (
        <p role="alert" className="m-0 text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
