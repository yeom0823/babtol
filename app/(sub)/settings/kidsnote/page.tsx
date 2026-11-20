import { CheckIcon } from "lucide-react";
import { connection } from "next/server";

import { BackLink } from "@/components/back-link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { lastSyncedAt } from "@/features/daycare-sync";
import { connectionStatus } from "@/features/kidsnote";

import { disconnectAction } from "./actions";
import { ConnectForm } from "./connect-form";

/** "3분 전", "2시간 전"처럼 마지막으로 가져온 때를 사람 말로 쓴다. */
function ago(ms: number | null): string {
  if (!ms) return "아직 가져오지 않았어요";
  const minutes = Math.max(0, Math.round((Date.now() - ms) / 60_000));
  if (minutes < 1) return "방금 가져왔어요";
  if (minutes < 60) return `${minutes}분 전에 가져왔어요`;
  const hours = Math.round(minutes / 60);
  return hours < 24 ? `${hours}시간 전에 가져왔어요` : `${Math.round(hours / 24)}일 전에 가져왔어요`;
}

/** 키즈노트 연결: 연결되어 있으면 상태와 끊기를 먼저 보이고, 다른 계정으로 다시 연결은 펼쳐야 보인다. */
export default async function KidsnoteConnectPage() {
  await connection();
  const status = await connectionStatus();
  const last = await lastSyncedAt();

  return (
    <>
      <BackLink href="/kid">우리 아이</BackLink>
      <div className="flex flex-col gap-2">
        <h1 className="text-[22px] font-bold tracking-tight">키즈노트 연결</h1>
        <p className="m-0 text-[13px] text-muted-foreground">
          어린이집 식단과 사진을 자동으로 가져와요. 한 집에서 한 사람만 연결하면 돼요.
        </p>
      </div>

      {status === "connected" ? (
        <>
          <section className="flex flex-col gap-3 rounded-3xl bg-primary/8 p-5">
              <div className="flex items-center gap-2.5">
                <span className="grid size-8 flex-none place-items-center rounded-full bg-emerald-600 text-white">
                  <CheckIcon aria-hidden="true" className="size-4" />
                </span>
                <span className="flex flex-col">
                  <span className="text-[15px] font-bold">연결되어 있어요</span>
                  <span className="text-xs text-muted-foreground">{ago(last)} · 1시간마다 다시 확인해요</span>
                </span>
              </div>
              <form action={disconnectAction}>
                <Button type="submit" variant="outline" size="sm" className="rounded-full bg-background px-4">
                  연결 끊기
                </Button>
              </form>
          </section>
          <details className="group text-sm">
            <summary className="cursor-pointer text-muted-foreground">다른 키즈노트 계정으로 다시 연결</summary>
            <div className="mt-3">
              <ConnectForm />
            </div>
          </details>
        </>
      ) : (
        <>
          {status === "expired" && (
            <Alert variant="destructive">
              <AlertTitle>연결이 끊겼어요</AlertTitle>
              <AlertDescription>키즈노트에 다시 로그인하면 식단을 이어서 가져와요.</AlertDescription>
            </Alert>
          )}
          <ConnectForm />
        </>
      )}
    </>
  );
}
