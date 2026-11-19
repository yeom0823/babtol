import Link from "next/link";

import { shoppingList } from "@/features/shopping";
import type { DayPlan } from "@/features/meal-plan";
import { loadPlan } from "@/features/today/server";
import { addDays, parseISODate, toISODate, weekOf } from "@/lib/date";
import { cn } from "@/lib/utils";

import { buildPlanAction } from "../actions";
import { PlansBuilder } from "./plans-builder";
import { ShoppingView } from "./shopping-view";

const DOW = ["일", "월", "화", "수", "목", "금", "토"];

/** 내일, 또는 내일부터 이번 주 일요일까지. 오늘이 일요일이면 이번 주 남은 날은 내일뿐이다. */
function rangeDates(today: string, range: "tomorrow" | "week"): string[] {
  const tomorrow = addDays(today, 1);
  if (range === "tomorrow") return [tomorrow];
  const sunday = weekOf(today)[6];
  const dates: string[] = [];
  for (let d = tomorrow; d <= sunday; d = addDays(d, 1)) dates.push(d);
  return dates.length ? dates : [tomorrow];
}

const dayNum = (iso: string) => parseISODate(iso).getDate();

export default async function ShopPage(props: PageProps<"/shop">) {
  const { range: raw } = await props.searchParams;
  const range = raw === "week" ? "week" : "tomorrow";
  const today = toISODate(new Date());
  const tomorrow = addDays(today, 1);
  const weekDates = rangeDates(today, "week");
  const dates = rangeDates(today, range);

  const plans = await Promise.all(dates.map(async (iso) => ({ iso, plan: await loadPlan(iso) })));
  const ready = plans.filter((p): p is { iso: string; plan: DayPlan } => p.plan !== null);
  const missing = plans.filter((p) => !p.plan).map((p) => p.iso);
  const list = shoppingList(ready);

  const first = parseISODate(dates[0]);
  const label =
    dates.length === 1
      ? `${first.getMonth() + 1}월 ${first.getDate()}일`
      : `${first.getMonth() + 1}월 ${first.getDate()}일~${dayNum(dates.at(-1)!)}일`;
  const tomorrowLabel = `내일 (${dayNum(tomorrow)}일 ${DOW[parseISODate(tomorrow).getDay()]})`;
  const weekLabel =
    weekDates.length > 1 ? `이번 주 (${dayNum(weekDates[0])}~${dayNum(weekDates.at(-1)!)}일)` : "이번 주 (내일까지)";

  return (
    <>
      <div className="flex flex-col gap-2">
        <h1 className="text-[22px] font-bold tracking-tight">장보기 목록</h1>
        <p className="m-0 text-[13px] text-muted-foreground">
          추천된 집 끼니에 필요한 재료를 모았어요. 집에 있으면 눌러서 지워 주세요.
        </p>
      </div>

      <nav aria-label="기간" className="grid grid-cols-2 gap-1 rounded-full bg-muted p-1">
        {(
          [
            ["tomorrow", tomorrowLabel],
            ["week", weekLabel],
          ] as const
        ).map(([value, text]) => (
          <Link
            key={value}
            href={value === "tomorrow" ? "/shop" : "/shop?range=week"}
            aria-current={range === value ? "page" : undefined}
            className={cn(
              "grid h-9 place-items-center rounded-full text-sm font-semibold text-muted-foreground",
              range === value && "bg-background text-foreground shadow-sm"
            )}
          >
            {text}
          </Link>
        ))}
      </nav>

      {missing.length > 0 && <PlansBuilder key={missing.join(",")} dates={missing} build={buildPlanAction} />}

      <ShoppingView key={`${range}-${ready.length}`} list={list} label={label} />
    </>
  );
}
