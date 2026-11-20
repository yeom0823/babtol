import { connection } from "next/server";
import Link from "next/link";
import { ChevronRightIcon, PlusIcon } from "lucide-react";

import { BabtolMascot } from "@/components/babtol-mascot";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Item, ItemContent, ItemDescription, ItemMedia, ItemTitle } from "@/components/ui/item";
import { getProfile } from "@/features/account/server";
import { listChildren, monthsOld, myFamily } from "@/features/family/server";
import { listAvoid } from "@/features/family-settings";
import { connectionStatus } from "@/features/kidsnote";
import { toISODate } from "@/lib/date";
import { cn } from "@/lib/utils";

import { createInviteAction } from "./actions";
import { InviteButton } from "./invite-button";

const KIDSNOTE_NOTE = {
  connected: "연결됨 · 식단과 사진을 자동으로 가져와요",
  expired: "연결이 끊겼어요 · 눌러서 다시 연결해 주세요",
  none: "연결하면 식단을 자동으로 가져와요",
} as const;

const Chevron = () => <ChevronRightIcon className="flex-none text-muted-foreground" />;

/** 이름 첫 글자를 둥근 배지로. 아이는 주황, 어른은 회색으로 구분한다. */
function Avatar({ name, kid, className }: { name: string; kid?: boolean; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "grid flex-none place-items-center rounded-full font-cute ring-2 ring-background",
        kid ? "size-12 bg-primary/12 text-xl text-primary" : "size-9 bg-muted text-base text-foreground",
        className
      )}
    >
      {name.slice(0, 1).toUpperCase()}
    </span>
  );
}

function SectionTitle({ children, extra }: { children: React.ReactNode; extra?: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-2 px-1">
      <h2 className="text-[15px] font-bold">{children}</h2>
      {extra && <span className="text-xs text-muted-foreground">{extra}</span>}
    </div>
  );
}

/**
 * 우리 아이: 아이 정보 → 가족 → 어린이집 식단 → 추천에서 뺄 음식 → 내 계정 순서.
 * 자주 보는 아이 정보를 맨 위에, 한 번 정하면 잘 안 바꾸는 계정은 맨 아래에 둔다.
 */
export default async function KidPage() {
  // 저장소를 요청 때마다 읽으므로 빌드 때 굳지 않게 동적으로 그린다.
  await connection();
  const [status, avoid, profile, family, kids] = await Promise.all([
    connectionStatus(),
    listAvoid(),
    getProfile(),
    myFamily(),
    listChildren(),
  ]);
  const today = toISODate(new Date());

  return (
    <>
      <h1 className="text-[22px] font-bold tracking-tight">우리 아이</h1>

      <section className="flex flex-col gap-2">
        <SectionTitle extra={kids.length ? `${kids.length}명` : undefined}>아이</SectionTitle>
        {kids.length === 0 ? (
          <div className="flex items-center gap-3 rounded-3xl bg-primary/8 p-4">
            <BabtolMascot className="size-16 flex-none" />
            <div className="flex min-w-0 flex-1 flex-col items-start gap-2">
              <div>
                <p className="m-0 font-cute text-lg text-primary">아이를 알려 주세요</p>
                <p className="m-0 text-[13px] text-muted-foreground">개월 수와 알레르기에 맞춰 추천해요.</p>
              </div>
              <Link href="/children/new" className={`${buttonVariants({ size: "sm" })} rounded-full`}>
                <PlusIcon data-icon="inline-start" />
                아이 추가
              </Link>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {kids.map((kid) => {
              const months = monthsOld(kid.birthMonth, today);
              return (
                <Link
                  key={kid.id}
                  href={`/children/${kid.id}`}
                  className="flex items-center gap-3 rounded-3xl bg-primary/8 p-3.5 transition-colors hover:bg-primary/12"
                >
                  <Avatar name={kid.name} kid />
                  <span className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="flex items-center gap-1.5">
                      <span className="truncate font-cute text-lg leading-none">{kid.name}</span>
                      {months !== null && (
                        <span className="rounded-full bg-background px-2 py-0.5 text-xs font-semibold text-primary">
                          {months}개월
                        </span>
                      )}
                    </span>
                    <span className="flex flex-wrap gap-1">
                      {kid.allergies.length ? (
                        kid.allergies.map((a) => (
                          <span key={a} className="rounded-full bg-background px-2 py-0.5 text-[11px] text-muted-foreground">
                            🚫 {a}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-muted-foreground">알레르기 없음</span>
                      )}
                    </span>
                  </span>
                  <Chevron />
                </Link>
              );
            })}
            <Link
              href="/children/new"
              className="flex items-center justify-center gap-1.5 rounded-3xl border border-dashed py-3 text-sm text-muted-foreground hover:bg-muted/50"
            >
              <PlusIcon className="size-4" />
              아이 추가
            </Link>
          </div>
        )}
      </section>

      {family && (
        <section className="flex flex-col gap-2">
          <SectionTitle extra={`${family.members.length}명`}>가족 · {family.name}</SectionTitle>
          <Card>
            <CardContent className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  {family.members.slice(0, 5).map((m) => (
                    <Avatar key={m.userId} name={m.name} />
                  ))}
                </div>
                <p className="m-0 min-w-0 flex-1 truncate text-sm">
                  {family.members.map((m) => (m.isMe ? `${m.name}(나)` : m.name)).join(", ")}
                </p>
              </div>
              <InviteButton create={createInviteAction} />
            </CardContent>
          </Card>
        </section>
      )}

      <section className="flex flex-col gap-2">
        <SectionTitle>어린이집 식단 가져오기</SectionTitle>
        <Card>
          <CardContent>
            <Item render={<Link href="/settings/kidsnote" />}>
              <ItemMedia variant="icon">🏫</ItemMedia>
              <ItemContent>
                <ItemTitle>키즈노트</ItemTitle>
                <ItemDescription>{KIDSNOTE_NOTE[status]}</ItemDescription>
              </ItemContent>
              <Chevron />
            </Item>
            <Item render={<Link href="/upload" />}>
              <ItemMedia variant="icon">📷</ItemMedia>
              <ItemContent>
                <ItemTitle>식단표 올리기</ItemTitle>
                <ItemDescription>키즈노트 없이 식단을 직접 올려요</ItemDescription>
              </ItemContent>
              <Chevron />
            </Item>
          </CardContent>
        </Card>
      </section>

      <section className="flex flex-col gap-2">
        <SectionTitle>추천에서 뺄 음식</SectionTitle>
        <Card>
          <CardContent>
            <Item render={<Link href="/avoid" />}>
              <ItemMedia variant="icon">🚫</ItemMedia>
              <ItemContent>
                <ItemTitle>가족 공통 피할 음식</ItemTitle>
                <ItemDescription>{avoid.length ? avoid.join(", ") : "아직 없어요"}</ItemDescription>
              </ItemContent>
              <Chevron />
            </Item>
            <Item render={<Link href="/favs" />}>
              <ItemMedia variant="icon">😣</ItemMedia>
              <ItemContent>
                <ItemTitle>잠깐 쉬는 메뉴</ItemTitle>
                <ItemDescription>&quot;남김&quot;을 누른 메뉴는 2주 동안 빼요</ItemDescription>
              </ItemContent>
              <Chevron />
            </Item>
          </CardContent>
        </Card>
      </section>

      {profile && (
        <section className="flex flex-col gap-2">
          <SectionTitle>내 계정</SectionTitle>
          <Link
            href="/settings"
            className="flex items-center gap-3 rounded-2xl border px-3.5 py-3 transition-colors hover:bg-muted/50"
          >
            <Avatar name={profile.displayName || profile.email} />
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-sm font-semibold">{profile.displayName || "이름 없음"}</span>
              <span className="truncate text-xs text-muted-foreground">{profile.email}</span>
            </span>
            <Chevron />
          </Link>
        </section>
      )}

      <p className="px-2 text-center text-xs text-muted-foreground">이 추천은 의료·영양 상담이 아니에요.</p>
    </>
  );
}
