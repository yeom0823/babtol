import Link from "next/link";
import { SettingsIcon } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { buttonVariants } from "@/components/ui/button";
import { getMenus } from "@/features/daycare-menu";
import { syncDaycareMenus } from "@/features/daycare-sync";
import { connectionStatus } from "@/features/kidsnote";
import { dayCoverage, type MealKey } from "@/features/meal-plan";
import {
  DayFoodGroups,
  DaycareLunch,
  HomeMealCard,
  MealCarousel,
  MealSlide,
  PlanBuilder,
  PlanSkeleton,
  WeekDatePicker,
  dayKind,
  describeDay,
  type CarouselSlide,
} from "@/features/today";
import { loadPlan } from "@/features/today/server";
import { getFeedbackFor } from "@/features/meal-feedback";
import { toISODate, weekOf } from "@/lib/date";

import {
  buildPlanAction,
  fillGroupAction,
  setFeedbackAction,
  swapDishAction,
  swapMealAction,
} from "./actions";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export default async function TodayPage(props: PageProps<"/">) {
  const { d } = await props.searchParams;
  const today = toISODate(new Date());
  const selected = typeof d === "string" && ISO_DATE.test(d) ? d : today;
  await syncDaycareMenus(today);
  const status = await connectionStatus();
  const menus = await getMenus(weekOf(selected));
  const menu = menus[selected] ?? null;
  const kind = dayKind(selected, menu);
  const plan = await loadPlan(selected);
  const { label, relative, note } = describeDay(selected, today);

  const feedback = await getFeedbackFor(selected);
  const actions = { swapDish: swapDishAction, swapMeal: swapMealAction, setFeedback: setFeedbackAction };
  const homeMeal = (meal: MealKey, title: string, sub: string) => {
    const data = plan?.[meal];
    return (
      <MealSlide who="home" title={title} sub={sub}>
        {data ? (
          <HomeMealCard iso={selected} meal={meal} data={data} feedback={feedback} actions={actions} />
        ) : (
          <PlanSkeleton />
        )}
      </MealSlide>
    );
  };
  const slides: CarouselSlide[] = [
    { meal: "breakfast", label: "아침", content: homeMeal("breakfast", "아침", "10분 안에 차릴 수 있게 골랐어요") },
    {
      meal: "lunch",
      label: "점심",
      content:
        kind === "off" ? (
          homeMeal("lunch", "점심", selected === today ? "오늘은 어린이집에 가지 않아요" : "이날은 어린이집에 가지 않아요")
        ) : (
          <DaycareLunch iso={selected} menu={menu} />
        ),
    },
    {
      meal: "snack",
      label: "간식",
      content: homeMeal(
        "snack",
        "간식",
        kind === "off" ? "오후 3시쯤 · 점심과 저녁 사이에 조금만" : "하원 후 · 저녁 먹기 1시간 반 전까지 조금만"
      ),
    },
    { meal: "dinner", label: "저녁", content: homeMeal("dinner", "저녁", "밥, 국, 반찬 한 상") },
  ];

  const coverage = plan ? dayCoverage(plan, kind === "off" ? null : menu) : null;

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

      <WeekDatePicker selected={selected} today={today} withMenu={new Set(Object.keys(menus))} />

      {status === "expired" && (
        <Alert variant="destructive" role="alert">
          <AlertTitle>키즈노트 연결이 끊겼어요</AlertTitle>
          <AlertDescription>다시 연결하면 오늘 어린이집 식단을 가져와서 추천해 드려요.</AlertDescription>
          <div className="mt-2 flex flex-wrap gap-2">
            <Link href="/settings/kidsnote" className={buttonVariants({ size: "sm" })}>
              다시 연결하기
            </Link>
            <Link href="/upload" className={buttonVariants({ variant: "outline", size: "sm" })}>
              📷 식단표 사진으로 올리기
            </Link>
          </div>
        </Alert>
      )}

      {note && (
        <div className="flex items-center gap-1.5 rounded-xl bg-muted px-3 py-2 text-[13px] text-muted-foreground">
          <span>{note}</span>
          <Link href="/" className={buttonVariants({ variant: "ghost", size: "sm" }) + " ml-auto flex-none"}>
            오늘로
          </Link>
        </div>
      )}

      {!plan && <PlanBuilder iso={selected} build={buildPlanAction} />}

      <MealCarousel key={`${selected}-${plan ? "plan" : "building"}`} slides={slides} isToday={selected === today} />

      {coverage && (
        <DayFoodGroups
          iso={selected}
          sources={coverage.sources}
          withoutDaycare={kind !== "daycare"}
          fill={fillGroupAction}
        />
      )}

      <p className="px-2 pb-2 text-center text-xs text-muted-foreground">
        이 추천은 의료·영양 상담이 아니에요. 알레르기나 성장이 걱정되면 소아청소년과 선생님과 먼저 상의해 주세요.
      </p>
    </>
  );
}
