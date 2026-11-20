import { BackLink } from "@/components/back-link";

import { ConnectForm } from "./connect-form";

export default function KidsnoteConnectPage() {
  return (
    <>
      <BackLink href="/kid">우리 아이</BackLink>
      <div className="flex flex-col gap-2">
        <h1 className="text-[22px] font-bold tracking-tight">키즈노트 연결</h1>
        <p className="m-0 text-[13px] text-muted-foreground">
          어린이집 식단을 매일 자동으로 가져오려고 키즈노트 계정으로 한 번 로그인해요. 한 집에서 한 사람만 연결하면 돼요.
        </p>
      </div>
      <ConnectForm />
    </>
  );
}
