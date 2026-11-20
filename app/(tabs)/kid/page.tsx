import { connection } from "next/server";
import Link from "next/link";
import { ChevronRightIcon } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getProfile } from "@/features/account/server";
import { Item, ItemContent, ItemDescription, ItemMedia, ItemTitle } from "@/components/ui/item";
import { listAvoid } from "@/features/family-settings";
import { connectionStatus } from "@/features/kidsnote";

const KIDSNOTE_NOTE = {
  connected: "연결됨 · 매일 자동으로 가져와요",
  expired: "연결이 끊겼어요 · 눌러서 다시 연결해 주세요",
  none: "연결하면 식단을 매일 자동으로 가져와요",
} as const;

/** 우리 아이: 아이 정보와, 추천에 쓰이는 연결·설정(어린이집 식단 가져오기, 피할 음식)을 모은다. */
export default async function KidPage() {
  // 저장소를 요청 때마다 읽으므로 빌드 때 굳지 않게 동적으로 그린다.
  await connection();
  const status = await connectionStatus();
  const avoid = await listAvoid();
  const profile = await getProfile();
  return (
    <>
      <h1 className="text-[22px] font-bold tracking-tight">우리 아이</h1>

      {/* 로그인 상태: 로그인하면 내 계정 카드(눌러서 이름 수정·로그아웃), 아니면 로그인 안내만 보인다. */}
      {profile ? (
        <Card size="sm">
          <CardContent>
            <Item render={<Link href="/settings" />} className="p-0">
              <ItemMedia>
                <span className="grid size-10 place-items-center rounded-full bg-primary/12 text-base font-bold text-primary">
                  {(profile.displayName || profile.email).slice(0, 1).toUpperCase()}
                </span>
              </ItemMedia>
              <ItemContent>
                <ItemTitle>{profile.displayName || "이름 없음"}</ItemTitle>
                <ItemDescription>{profile.email}</ItemDescription>
              </ItemContent>
              <ChevronRightIcon className="text-muted-foreground" />
            </Item>
          </CardContent>
        </Card>
      ) : (
        <Card size="sm">
          <CardContent className="flex items-center gap-3">
            <span className="flex-1 text-sm text-muted-foreground">로그인하면 가족과 식단·기록을 함께 볼 수 있어요.</span>
            <Link href="/auth/login?next=/kid" className={buttonVariants({ size: "sm" })}>
              Google로 로그인
            </Link>
          </CardContent>
        </Card>
      )}

      <section className="flex flex-col gap-2">
        <h2 className="text-[15px] font-bold">아이 정보</h2>
        <Card>
          <CardContent>
            <Item>
              <ItemMedia variant="icon">👶</ItemMedia>
              <ItemContent>
                <ItemTitle>아이 이름과 개월 수</ItemTitle>
                <ItemDescription>로그인 기능과 함께 추가할 예정이에요. 지금은 어린아이 기준으로 추천해요.</ItemDescription>
              </ItemContent>
            </Item>
          </CardContent>
        </Card>
      </section>

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
              <ChevronRightIcon className="text-muted-foreground" />
            </Item>
            <Item render={<Link href="/upload" />}>
              <ItemMedia variant="icon">📷</ItemMedia>
              <ItemContent>
                <ItemTitle>식단표 올리기</ItemTitle>
                <ItemDescription>키즈노트 없이 식단을 직접 올려요</ItemDescription>
              </ItemContent>
              <ChevronRightIcon className="text-muted-foreground" />
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
                <ItemTitle>피할 음식</ItemTitle>
                <ItemDescription>{avoid.length ? avoid.join(", ") : "아직 없어요"}</ItemDescription>
              </ItemContent>
              <ChevronRightIcon className="text-muted-foreground" />
            </Item>
            <Item render={<Link href="/favs" />}>
              <ItemMedia variant="icon">😣</ItemMedia>
              <ItemContent>
                <ItemTitle>잠깐 쉬는 메뉴</ItemTitle>
                <ItemDescription>&quot;남김&quot;을 누른 메뉴는 2주 동안 빼요</ItemDescription>
              </ItemContent>
              <ChevronRightIcon className="text-muted-foreground" />
            </Item>
          </CardContent>
        </Card>
      </section>

      <p className="px-2 text-center text-xs text-muted-foreground">
        이 추천은 의료·영양 상담이 아니에요.
      </p>
    </>
  );
}
