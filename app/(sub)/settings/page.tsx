import { redirect } from "next/navigation";
import { connection } from "next/server";

import { BackLink } from "@/components/back-link";
import { Card, CardContent } from "@/components/ui/card";
import { LogoutButton } from "@/features/account";
import { getProfile } from "@/features/account/server";

import { saveDisplayNameAction } from "./actions";
import { DisplayNameForm } from "./display-name-form";

/** 내 계정: 로그인한 사람만 들어온다(proxy.ts가 막고, 여기서도 서버가 다시 확인한다). */
export default async function AccountPage() {
  await connection();
  const profile = await getProfile();
  if (!profile) redirect("/auth/login?next=/settings");

  return (
    <>
      <BackLink href="/kid">우리 아이</BackLink>
      <h1 className="text-[22px] font-bold tracking-tight">내 계정</h1>
      <Card>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-sm font-semibold">이메일</span>
            <span className="text-sm text-muted-foreground">{profile.email}</span>
          </div>
          <DisplayNameForm initial={profile.displayName ?? ""} save={saveDisplayNameAction} />
        </CardContent>
      </Card>
      <LogoutButton />
    </>
  );
}
