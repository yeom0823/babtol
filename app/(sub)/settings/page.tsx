import Link from "next/link";
import { ChevronRightIcon } from "lucide-react";

import { BackLink } from "@/components/back-link";
import { Card, CardContent } from "@/components/ui/card";
import { Item, ItemContent, ItemDescription, ItemMedia, ItemTitle } from "@/components/ui/item";

export default function SettingsPage() {
  return (
    <>
      <BackLink href="/">오늘</BackLink>
      <h1 className="text-[22px] font-bold tracking-tight">설정</h1>

      <section className="flex flex-col gap-2">
        <h2 className="text-[15px] font-bold">어린이집 식단 가져오기</h2>
        <Card>
          <CardContent>
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

      <p className="px-2 text-center text-xs text-muted-foreground">
        이 추천은 의료·영양 상담이 아니에요.
      </p>
    </>
  );
}
