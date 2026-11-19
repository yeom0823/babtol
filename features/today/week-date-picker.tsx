import Link from "next/link";

import { addDays, parseISODate, weekOf } from "@/lib/date";
import { cn } from "@/lib/utils";

const DOW = ["일", "월", "화", "수", "목", "금", "토"];

/** 주 단위 날짜 줄. 날짜를 누르면 ?d=날짜로 이동하고, 오늘은 주소에 날짜를 쓰지 않는다. */
export function WeekDatePicker({
  selected,
  today,
  withMenu,
}: {
  selected: string;
  today: string;
  withMenu: Set<string>;
}) {
  const href = (iso: string) => (iso === today ? "/" : `/?d=${iso}`);
  return (
    <nav aria-label="날짜 고르기" className="flex items-center gap-0.5">
      <Link
        href={href(addDays(selected, -7))}
        aria-label="지난주"
        className="grid size-[30px] flex-none place-items-center rounded-full text-lg hover:bg-accent"
      >
        ‹
      </Link>
      <div className="grid min-w-0 flex-1 grid-cols-7 gap-0.5">
        {weekOf(selected).map((iso) => {
          const d = parseISODate(iso);
          const dow = d.getDay();
          const isSelected = iso === selected;
          const isToday = iso === today;
          return (
            <Link
              key={iso}
              href={href(iso)}
              aria-current={isSelected ? "date" : undefined}
              aria-label={`${d.getMonth() + 1}월 ${d.getDate()}일 ${DOW[dow]}요일${isToday ? " 오늘" : ""}`}
              className="relative flex flex-col items-center gap-px rounded-2xl pt-1 pb-1.5"
            >
              <span
                className={cn(
                  "text-[11px] text-muted-foreground",
                  (dow === 0 || dow === 6) && "text-destructive/70"
                )}
              >
                {isToday ? "오늘" : DOW[dow]}
              </span>
              <span
                className={cn(
                  "grid size-[30px] place-items-center rounded-full text-[15px] font-bold",
                  isToday && !isSelected && "text-primary ring-[1.5px] ring-primary ring-inset",
                  isSelected && "bg-primary text-primary-foreground"
                )}
              >
                {d.getDate()}
              </span>
              <span
                className={cn(
                  "size-1 rounded-full bg-transparent",
                  withMenu.has(iso) && "bg-muted-foreground/50"
                )}
              />
            </Link>
          );
        })}
      </div>
      <Link
        href={href(addDays(selected, 7))}
        aria-label="다음 주"
        className="grid size-[30px] flex-none place-items-center rounded-full text-lg hover:bg-accent"
      >
        ›
      </Link>
    </nav>
  );
}
