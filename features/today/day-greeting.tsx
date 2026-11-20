"use client";

import { useSyncExternalStore } from "react";

import type { DayKind } from "./day-kind";
import { mealAtHour, type Meal } from "./meal-time";

const subscribeNothing = () => () => {};

const QUESTION: Record<Meal, string> = {
  breakfast: "오늘 아침 뭐 먹을까요?",
  lunch: "오늘 점심 뭐 먹을까요?",
  snack: "오후 간식 뭐 줄까요?",
  dinner: "오늘 저녁 뭐 먹을까요?",
};

const KIND_NOTE: Record<DayKind, string> = {
  daycare: "어린이집 가는 날",
  missing: "어린이집 식단이 아직 없어요",
  off: "집에서 먹는 날",
};

/**
 * 상단 인사 한 줄. 오늘이면 지금 시간대의 끼니를 묻고, 다른 날이면 그날을 가리킨다.
 * 날짜는 아래 작은 글씨로 한 번만 쓴다(주간 달력이 날짜를 다시 보여 주므로).
 */
export function DayGreeting({
  isToday,
  relative,
  label,
  kind,
}: {
  isToday: boolean;
  /** "어제", "내일", "3일 전" 같은 말. 오늘이면 빈 문자열. */
  relative: string;
  label: string;
  kind: DayKind;
}) {
  // 서버에서는 시간을 모르므로 null, 브라우저에서는 지금 시간의 끼니다.
  const now = useSyncExternalStore(subscribeNothing, () => mealAtHour(new Date().getHours()), () => null);
  const title = !isToday
    ? `${relative} 끼니${relative.endsWith("전") || relative === "어제" ? "예요" : " 미리 보기"}`
    : now === "lunch" && kind === "daycare"
      ? "점심은 어린이집에서 먹어요"
      : now
        ? QUESTION[now]
        : "오늘 뭐 먹을까요?";

  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <h1 className="text-[22px] leading-tight font-bold tracking-tight">{title}</h1>
      <p className="m-0 text-[13px] text-muted-foreground">
        {label} · {KIND_NOTE[kind]}
      </p>
    </div>
  );
}
