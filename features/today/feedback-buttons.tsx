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
      : "기록했어요";

/** 먹은 결과: 셋 중 하나를 누르면 그 상태가 되고, 다시 누르면 취소된다(AC7). */
export function FeedbackButtons({
  iso,
  meal,
  name,
  initial,
  save,
}: {
  iso: string;
  meal: MealKey;
  name: string;
  initial: FeedbackValue | null;
  save: (iso: string, meal: MealKey, name: string, value: FeedbackValue | null) => Promise<{ ok: boolean }>;
}) {
  const [value, setValue] = useState<FeedbackValue | null>(initial);
  const [message, setMessage] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const press = (picked: FeedbackValue) => {
    const previous = value;
    const next = value === picked ? null : picked;
    setValue(next);
    setMessage(next ? messageFor(name, next) : null);
    startTransition(async () => {
      const result = await save(iso, meal, name, next);
      if (!result.ok) {
        setValue(previous);
        setMessage("기록하지 못했어요. 다시 눌러 주세요.");
      }
    });
  };

  return (
    <div className="flex flex-col gap-1">
      <div role="group" aria-label={`${name} 먹은 반응`} className="grid grid-cols-3 gap-1.5">
        {OPTIONS.map(([emoji, label]) => (
          <button
            key={label}
            type="button"
            aria-pressed={value === label}
            onClick={() => press(label)}
            className={cn(
              "inline-flex h-9 items-center justify-center gap-1 rounded-full border bg-background text-[13px]",
              value === label && "border-foreground bg-foreground font-bold text-background"
            )}
          >
            {emoji} {label}
          </button>
        ))}
      </div>
      {message && (
        <p role="status" className="m-0 text-xs text-muted-foreground">
          {message}
        </p>
      )}
    </div>
  );
}
