"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

/**
 * 그날 추천이 아직 없으면 만든다. 무료 모델은 1분 가까이 걸릴 수 있어서 화면을 막지 않고,
 * 만드는 중과 실패(1분 뒤 다시) 상태를 보여 준다.
 */
export function PlanBuilder({
  iso,
  build,
}: {
  iso: string;
  build: (iso: string) => Promise<{ ok: boolean }>;
}) {
  const router = useRouter();
  const [state, setState] = useState<"building" | "failed">("building");
  const started = useRef<string | null>(null);

  const start = () => {
    setState("building");
    build(iso).then((result) => {
      if (result.ok) router.refresh();
      else setState("failed");
    });
  };

  useEffect(() => {
    // 개발 모드의 이중 실행에도 같은 날짜는 한 번만 요청한다.
    if (started.current === iso) return;
    started.current = iso;
    start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [iso]);

  if (state === "building") {
    return (
      <p
        role="status"
        className="m-0 flex items-center gap-2 text-[13px] text-muted-foreground"
      >
        <Spinner /> 어린이집 식단을 보고 고르는 중이에요. 1분쯤 걸릴 수 있어요.
      </p>
    );
  }
  return (
    <Alert variant="destructive" role="alert">
      <AlertTitle>지금은 추천을 만들 수 없어요</AlertTitle>
      <AlertDescription>
        잠깐 사용량이 많아요. 1분쯤 뒤에 다시 눌러 주세요. 어린이집 식단은 아래에서 볼 수 있어요.
      </AlertDescription>
      <div className="mt-2">
        <Button size="sm" onClick={start}>
          다시 추천받기
        </Button>
      </div>
    </Alert>
  );
}
