import { redirect } from "next/navigation";
import { connection } from "next/server";

import { BackLink } from "@/components/back-link";
import { LogoutButton } from "@/features/account";
import { getProfile } from "@/features/account/server";

import { saveDisplayNameAction } from "./actions";
import { DisplayNameForm } from "./display-name-form";

/** 내 계정: 로그인한 사람만 들어온다(proxy.ts가 막고, 여기서도 서버가 다시 확인한다). */
export default async function AccountPage() {
  await connection();
  const profile = await getProfile();
  if (!profile) redirect("/auth/login?next=/settings");
  const name = profile.displayName || profile.email;

  return (
    <>
      <BackLink href="/kid">우리 아이</BackLink>
      <div className="flex flex-col items-center gap-2 py-2 text-center">
        <span aria-hidden="true" className="grid size-20 place-items-center rounded-full bg-primary/12 font-cute text-3xl text-primary">
          {name.slice(0, 1).toUpperCase()}
        </span>
        <div>
          <h1 className="m-0 font-cute text-2xl">{profile.displayName || "이름 없음"}</h1>
          <p className="m-0 text-[13px] text-muted-foreground">{profile.email}</p>
        </div>
      </div>
      <section className="rounded-3xl bg-primary/8 p-5">
        <DisplayNameForm initial={profile.displayName ?? ""} save={saveDisplayNameAction} />
      </section>
      <p className="m-0 px-1 text-xs text-muted-foreground">이메일은 Google 계정에서 가져와서 여기서 바꿀 수 없어요.</p>
      <div className="flex justify-center pt-2">
        <LogoutButton />
      </div>
    </>
  );
}
