import { connection } from "next/server";
import Link from "next/link";
import { ChevronRightIcon, PlusIcon } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Item, ItemContent, ItemDescription, ItemMedia, ItemTitle } from "@/components/ui/item";
import { getProfile } from "@/features/account/server";
import { listChildren, monthsOld, myFamily } from "@/features/family/server";
import { listAvoid } from "@/features/family-settings";
import { connectionStatus } from "@/features/kidsnote";
import { toISODate } from "@/lib/date";

import { createInviteAction } from "./actions";
import { InviteButton } from "./invite-button";

const KIDSNOTE_NOTE = {
  connected: "연결됨 · 식단과 사진을 자동으로 가져와요",
  expired: "연결이 끊겼어요 · 눌러서 다시 연결해 주세요",
  none: "연결하면 식단을 자동으로 가져와요",
} as const;

const Chevron = () => <ChevronRightIcon className="text-muted-foreground" />;

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
        <h2 className="text-[15px] font-bold">아이</h2>
        <Card>
          <CardContent className="flex flex-col">
            {kids.map((kid) => {
              const months = monthsOld(kid.birthMonth, today);
              return (
                <Item key={kid.id} render={<Link href={`/children/${kid.id}`} />}>
                  <ItemMedia variant="icon">👶</ItemMedia>
                  <ItemContent>
                    <ItemTitle>
                      {kid.name}
                      {months !== null && <span className="font-normal text-muted-foreground">{months}개월</span>}
                    </ItemTitle>
                    <ItemDescription>
                      {kid.allergies.length ? `알레르기 ${kid.allergies.join(", ")}` : "알레르기 없음"}
                    </ItemDescription>
                  </ItemContent>
                  <Chevron />
                </Item>
              );
            })}
            {!kids.length && (
              <p className="m-0 px-2 py-1 text-[13px] text-muted-foreground">
                아이를 등록하면 개월 수와 알레르기에 맞춰 추천해요.
              </p>
            )}
            <Link href="/children/new" className={`${buttonVariants({ variant: "ghost", size: "sm" })} mt-1 self-start`}>
              <PlusIcon data-icon="inline-start" />
              아이 추가
            </Link>
          </CardContent>
        </Card>
      </section>

      {family && (
        <section className="flex flex-col gap-2">
          <h2 className="text-[15px] font-bold">가족 · {family.name}</h2>
          <Card>
            <CardContent className="flex flex-col gap-3">
              <ul className="m-0 flex list-none flex-col gap-2 p-0">
                {family.members.map((m) => (
                  <li key={m.userId} className="flex items-center gap-2.5">
                    <span className="grid size-8 flex-none place-items-center rounded-full bg-muted text-sm font-bold">
                      {m.name.slice(0, 1).toUpperCase()}
                    </span>
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate text-sm font-semibold">
                        {m.name}
                        {m.isMe && <span className="font-normal text-muted-foreground"> · 나</span>}
                      </span>
                      <span className="truncate text-xs text-muted-foreground">{m.email}</span>
                    </span>
                  </li>
                ))}
              </ul>
              <InviteButton create={createInviteAction} />
            </CardContent>
          </Card>
        </section>
      )}

      <section className="flex flex-col gap-2">
        <h2 className="text-[15px] font-bold">어린이집 식단 가져오기</h2>
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
        <h2 className="text-[15px] font-bold">추천에서 뺄 음식</h2>
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
          <h2 className="text-[15px] font-bold">내 계정</h2>
          <Card size="sm">
            <CardContent>
              <Item render={<Link href="/settings" />} className="p-0">
                <ItemContent>
                  <ItemTitle>{profile.displayName || "이름 없음"}</ItemTitle>
                  <ItemDescription>{profile.email}</ItemDescription>
                </ItemContent>
                <Chevron />
              </Item>
            </CardContent>
          </Card>
        </section>
      )}

      <p className="px-2 text-center text-xs text-muted-foreground">이 추천은 의료·영양 상담이 아니에요.</p>
    </>
  );
}
