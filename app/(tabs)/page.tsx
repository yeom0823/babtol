import Link from "next/link";
import { SettingsIcon } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { getMenus } from "@/features/daycare-menu";
import {
  DaycareLunch,
  MealCarousel,
  MealSlide,
  WeekDatePicker,
  dayKind,
  describeDay,
  type CarouselSlide,
} from "@/features/today";
import { toISODate, weekOf } from "@/lib/date";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export default async function TodayPage(props: PageProps<"/">) {
  const { d } = await props.searchParams;
  const today = toISODate(new Date());
  const selected = typeof d === "string" && ISO_DATE.test(d) ? d : today;
  const menus = await getMenus(weekOf(selected));
  const menu = menus[selected] ?? null;
  const kind = dayKind(selected, menu);
  const { label, relative, note } = describeDay(selected, today);

  const homeMeal = (title: string, sub: string) => (
    <MealSlide who="home" title={title} sub={sub}>
      <HomeMealPending />
    </MealSlide>
  );
  const slides: CarouselSlide[] = [
    { meal: "breakfast", label: "아침", content: homeMeal("아침", "10분 안에 차릴 수 있게 골랐어요") },
    {
      meal: "lunch",
      label: "점심",
      content:
        kind === "off" ? (
          homeMeal("점심", selected === today ? "오늘은 어린이집에 가지 않아요" : "이날은 어린이집에 가지 않아요")
        ) : (
          <DaycareLunch iso={selected} menu={menu} />
        ),
    },
    {
      meal: "snack",
      label: "간식",
      content: homeMeal(
        "간식",
        kind === "off"
          ? "오후 3시쯤 · 점심과 저녁 사이에 조금만"
          : "하원 후 · 저녁 먹기 1시간 반 전까지 조금만"
      ),
    },
    { meal: "dinner", label: "저녁", content: homeMeal("저녁", "밥, 국, 반찬 한 상") },
  ];

  return (
    <>
      <header className="flex items-center justify-between gap-3">
        <div className="flex flex-col">
          <span className="text-xs font-semibold text-muted-foreground">
            {selected === today ? "오늘" : relative}
          </span>
          <h1 className="text-[26px] leading-tight font-bold tracking-tight">{label}</h1>
        </div>
        <Link href="/settings" aria-label="설정" className={buttonVariants({ variant: "outline", size: "icon" })}>
          <SettingsIcon />
        </Link>
      </header>

      <WeekDatePicker
        selected={selected}
        today={today}
        withMenu={new Set(Object.keys(menus))}
      />

      {note && (
        <div className="flex items-center gap-1.5 rounded-xl bg-muted px-3 py-2 text-[13px] text-muted-foreground">
          <span>{note}</span>
          <Link href="/" className={buttonVariants({ variant: "ghost", size: "sm" }) + " ml-auto flex-none"}>
            오늘로
          </Link>
        </div>
      )}

      <MealCarousel key={selected} slides={slides} isToday={selected === today} />

      <p className="px-2 pb-2 text-center text-xs text-muted-foreground">
        이 추천은 의료·영양 상담이 아니에요. 알레르기나 성장이 걱정되면 소아청소년과 선생님과 먼저 상의해 주세요.
      </p>
    </>
  );
}

/** 집 끼니 추천이 연결되기 전의 자리. 추천 아웃컴에서 실제 추천 카드로 바뀐다. */
function HomeMealPending() {
  return (
    <Empty className="rounded-2xl border">
      <EmptyHeader>
        <EmptyMedia variant="icon">🍽️</EmptyMedia>
        <EmptyTitle>추천을 준비하고 있어요</EmptyTitle>
        <EmptyDescription>집 끼니 추천은 곧 이 자리에 나와요.</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}

