"use client";

import { useState, useTransition } from "react";

import type { FeedbackValue } from "@/features/meal-feedback";
import type { MealKey } from "@/features/meal-plan";
import { josa } from "@/lib/josa";
import { cn } from "@/lib/utils";

const OPTIONS: [string, FeedbackValue][] = [
  ["😋", "잘 먹음"],
  ["🙂", "보통"],
  ["😣", "남김"],
];

const messageFor = (name: string, value: FeedbackValue) =>
  value === "남김"
    ? `${josa(name, "은", "는")} 2주 동안 추천하지 않을게요`
    : value === "잘 먹음"
      ? `${josa(name, "을", "를")} 다음에 더 자주 추천할게요`
      : `${name}: 보통으로 기록했어요`;

/**
 * 먹은 반응: 목록 줄 옆에 두는 글자 없는 표정 버튼 3개. 누르면 그 상태가 되고 다시 누르면 취소된다(AC7).
 * 고르지 않은 표정은 흐리게 두어 눌린 것만 눈에 띄게 한다. 안내 문장은 버튼 옆이 좁아서 onMessage로 넘긴다.
 */
export function FeedbackButtons({
  iso,
  meal,
  name,
  initial,
  save,
  onMessage,
}: {
  iso: string;
  meal: MealKey;
  name: string;
  initial: FeedbackValue | null;
  save: (iso: string, meal: MealKey, name: string, value: FeedbackValue | null) => Promise<{ ok: boolean }>;
  onMessage: (message: string | null) => void;
}) {
  const [value, setValue] = useState<FeedbackValue | null>(initial);
  const [, startTransition] = useTransition();

  const press = (picked: FeedbackValue) => {
    const previous = value;
    const next = value === picked ? null : picked;
    setValue(next);
    onMessage(next ? messageFor(name, next) : null);
    startTransition(async () => {
      const result = await save(iso, meal, name, next);
      if (!result.ok) {
        setValue(previous);
        onMessage("기록하지 못했어요. 다시 눌러 주세요.");
      }
    });
  };

  return (
    <div role="group" aria-label={`${name} 먹은 반응`} className="flex flex-none gap-0.5">
      {OPTIONS.map(([emoji, label]) => {
        const on = value === label;
        return (
          <button
            key={label}
            type="button"
            aria-label={label}
            title={label}
            aria-pressed={on}
            onClick={() => press(label)}
            className={cn(
              "grid size-8 place-items-center rounded-full text-lg transition",
              on ? "bg-muted ring-1 ring-foreground/30" : "opacity-40 grayscale hover:opacity-80 hover:grayscale-0"
            )}
          >
            <span aria-hidden="true">{emoji}</span>
          </button>
        );
      })}
    </div>
  );
}
