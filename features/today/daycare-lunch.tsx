import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import type { StoredMenu } from "@/features/daycare-menu";

import { MealSlide } from "./meal-slide";

/** 평일 점심 장: 어린이집 식단을 읽기 전용으로 보여 준다. 식단이 없는 날은 올리기로 안내한다. */
export function DaycareLunch({ iso, menu }: { iso: string; menu: StoredMenu | null }) {
  if (!menu) {
    return (
      <MealSlide who="daycare" title="점심" sub="어린이집 식단이 아직 없어요.">
        <Card className="bg-muted ring-0">
          <CardContent>
            <Empty className="p-2">
              <EmptyHeader>
                <EmptyMedia variant="icon">🗒️</EmptyMedia>
                <EmptyTitle>이날 식단이 아직 없어요</EmptyTitle>
                <EmptyDescription>
                  식단표 사진이 있으면 올려 주세요. 없어도 집 끼니는 추천해 드려요.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Link href={`/upload?d=${iso}`} className={buttonVariants({ size: "sm" })}>
                  📷 식단표 올리기
                </Link>
              </EmptyContent>
            </Empty>
          </CardContent>
        </Card>
      </MealSlide>
    );
  }
  const from =
    menu.source === "upload" ? "올린 식단표에서 읽었어요." : "키즈노트에서 가져왔어요.";
  return (
    <MealSlide who="daycare" title="점심" sub={`${from} 집에서 챙길 건 없어요.`}>
      <Card className="bg-muted ring-0">
        <CardContent className="flex flex-col gap-3">
          {menu.photos?.lunch ? (
            <DaycarePhoto src={menu.photos.lunch} alt="어린이집 점심 사진" className="h-[170px] w-full rounded-[18px]" />
          ) : (
            menu.source === "kidsnote" && <p className="m-0 text-xs text-muted-foreground">사진은 아직 안 올라왔어요</p>
          )}
          <dl className="m-0 flex flex-col gap-2.5 text-sm">
            <MenuLine term="오전간식" dishes={menu.morningSnack} photo={menu.photos?.morningSnack} />
            <MenuLine term="점심" dishes={menu.lunch} />
            <MenuLine term="오후간식" dishes={menu.afternoonSnack} photo={menu.photos?.afternoonSnack} />
          </dl>
        </CardContent>
      </Card>
    </MealSlide>
  );
}

function MenuLine({ term, dishes, photo }: { term: string; dishes: string[]; photo?: string }) {
  if (!dishes.length) return null;
  return (
    <div className="grid grid-cols-[58px_1fr_auto] items-start gap-2">
      <dt className="text-[13px] text-muted-foreground">{term}</dt>
      <dd className="m-0">{dishes.join(", ")}</dd>
      {photo && <DaycarePhoto src={photo} alt={`어린이집 ${term} 사진`} className="size-[46px] rounded-[10px]" />}
    </div>
  );
}

/** 키즈노트에 올라온 어린이집 식단 사진. 외부 주소라 next/image를 쓰지 않는다. */
function DaycarePhoto({ src, alt, className }: { src: string; alt: string; className: string }) {
  return (
    <a href={src} target="_blank" rel="noreferrer" className={`block overflow-hidden bg-background ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} loading="lazy" referrerPolicy="no-referrer" className="size-full object-cover" />
    </a>
  );
}
