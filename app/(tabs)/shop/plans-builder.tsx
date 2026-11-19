"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

/** 장보기 기간에 추천이 아직 없는 날을 하나씩 만든다. 다 만들면 목록을 다시 그린다. */
export function PlansBuilder({
  dates,
  build,
}: {
  dates: string[];
  build: (iso: string) => Promise<{ ok: boolean }>;
}) {
  const router = useRouter();
  const [done, setDone] = useState(0);
  const [failed, setFailed] = useState(false);
  const started = useRef<string | null>(null);

  const run = async () => {
    setFailed(false);
    for (const [i, iso] of dates.entries()) {
      const result = await build(iso);
      if (!result.ok) {
        setFailed(true);
        return;
      }
      setDone(i + 1);
    }
    router.refresh();
  };

  useEffect(() => {
    const key = dates.join(",");
    if (started.current === key) return;
    started.current = key;
    void run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dates]);

  if (failed) {
    return (
      <Alert variant="destructive" role="alert">
        <AlertTitle>지금은 추천을 만들 수 없어요</AlertTitle>
        <AlertDescription>1분쯤 뒤에 다시 눌러 주세요. 추천이 있는 날의 재료만 아래에 모았어요.</AlertDescription>
        <div className="mt-2">
          <Button size="sm" onClick={() => void run()}>
            다시 추천받기
          </Button>
        </div>
      </Alert>
    );
  }
  return (
    <p role="status" className="m-0 flex items-center gap-2 text-[13px] text-muted-foreground">
      <Spinner /> 아직 추천이 없는 날을 만드는 중이에요 ({done}/{dates.length})
    </p>
  );
}
