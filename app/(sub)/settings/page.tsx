import Link from "next/link";
import { ChevronRightIcon } from "lucide-react";

import { BackLink } from "@/components/back-link";
import { Card, CardContent } from "@/components/ui/card";
import { Item, ItemContent, ItemDescription, ItemMedia, ItemTitle } from "@/components/ui/item";
import { listAvoid } from "@/features/family-settings";
import { connectionStatus } from "@/features/kidsnote";

const KIDSNOTE_NOTE = {
  connected: "연결됨 · 매일 자동으로 가져와요",
  expired: "연결이 끊겼어요 · 눌러서 다시 연결해 주세요",
  none: "연결하면 식단을 매일 자동으로 가져와요",
} as const;

export default async function SettingsPage() {
  const status = await connectionStatus();
  const avoid = await listAvoid();
  return (
    <>
      <BackLink href="/">오늘</BackLink>
      <h1 className="text-[22px] font-bold tracking-tight">설정</h1>

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
