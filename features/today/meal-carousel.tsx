"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

import { mealAtHour, type Meal } from "./meal-time";

export type CarouselSlide = { meal: Meal; label: string; content: ReactNode };

const subscribeNothing = () => () => {};

/**
 * 끼니 4장을 좌우로 밀거나 탭으로 넘긴다. 오늘이면 지금 시간에 맞는 끼니부터 열고,
 * 슬라이드 높이는 보고 있는 끼니에 맞춘다(AC5).
 */
export function MealCarousel({ slides, isToday }: { slides: CarouselSlide[]; isToday: boolean }) {
  const scroller = useRef<HTMLDivElement>(null);
  const slideEls = useRef<(HTMLDivElement | null)[]>([]);
  const [active, setActive] = useState(0);
  const [height, setHeight] = useState<number | undefined>();
  // 서버에서는 시간을 모르므로 null, 브라우저에서는 지금 시간의 끼니다.
  const nowMeal = useSyncExternalStore(
    subscribeNothing,
    () => mealAtHour(new Date().getHours()),
    () => null
  );
  const nowIndex = isToday && nowMeal ? slides.findIndex((s) => s.meal === nowMeal) : -1;

  const goTo = useCallback((index: number, smooth: boolean) => {
    const el = scroller.current;
    if (!el) return;
    el.scrollTo({ left: index * el.clientWidth, behavior: smooth ? "smooth" : "instant" });
    setActive(index);
    if (!smooth) setHeight(slideEls.current[index]?.scrollHeight);
  }, []);

  // 처음 열 때: 오늘이면 지금 시간의 끼니, 다른 날이면 아침부터.
  useEffect(() => {
    const index = isToday
      ? Math.max(0, slides.findIndex((s) => s.meal === mealAtHour(new Date().getHours())))
      : 0;
    goTo(index, false);
    // 날짜(isToday)가 바뀔 때만 다시 맞춘다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isToday, goTo]);

  /**
   * 높이는 스크롤 위치에서 바로 계산한다. 두 슬라이드 사이를 넘기는 중에는 둘 중 큰 높이를 써서
   * 넘어오는 카드가 잘리지 않게 하고, 멈추면 그 카드 높이에 맞춘다. 탭 표시도 넘기는 중에 바로 바뀐다.
   */
  const fitToScroll = useCallback(() => {
    const el = scroller.current;
    if (!el?.clientWidth) return;
    const pos = el.scrollLeft / el.clientWidth;
    const heightOf = (i: number) => slideEls.current[i]?.scrollHeight ?? 0;
    const settled = Math.abs(pos - Math.round(pos)) < 0.02;
    setHeight(settled ? heightOf(Math.round(pos)) : Math.max(heightOf(Math.floor(pos)), heightOf(Math.ceil(pos))));
    setActive(Math.round(pos));
  }, []);

  // 슬라이드 내용(카드 펼침, 메뉴 바꾸기 등)이 바뀌어도 높이를 다시 맞춘다.
  useEffect(() => {
    fitToScroll();
    const observer = new ResizeObserver(fitToScroll);
    slideEls.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, [slides, fitToScroll]);

  const frame = useRef(0);
  const onScroll = () => {
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(fitToScroll);
  };

  return (
    <div className="flex flex-col gap-3">
      <Tabs value={String(active)} onValueChange={(v) => goTo(Number(v), true)}>
        <TabsList aria-label="끼니" className="sticky top-0 z-10 h-11 w-full rounded-full p-1">
          {slides.map((s, i) => (
            <TabsTrigger key={s.meal} value={String(i)} className="rounded-full text-sm font-semibold">
              {s.label}
              {nowIndex === i && (
                <span className="absolute -top-1.5 right-2 rounded-full bg-primary px-1.5 text-[10px] leading-4 font-bold text-primary-foreground">
                  지금
                </span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      <div
        ref={scroller}
        onScroll={onScroll}
        aria-live="polite"
        style={{ height }}
        className="-mx-4 flex snap-x snap-mandatory items-start overflow-x-auto overflow-y-hidden overscroll-x-contain [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {slides.map((s, i) => (
          <div
            key={s.meal}
            ref={(el) => {
              slideEls.current[i] = el;
            }}
            role="tabpanel"
            aria-label={s.label}
            className="flex min-w-0 flex-[0_0_100%] snap-center snap-always flex-col gap-3 px-4 pb-1.5"
          >
            {s.content}
          </div>
        ))}
      </div>
      <div className="flex justify-center gap-1.5" aria-hidden="true">
        {slides.map((s, i) => (
          <span
            key={s.meal}
            className={cn(
              "h-1.5 rounded-full bg-border transition-all",
              active === i ? "w-[18px] bg-primary" : "w-1.5"
            )}
          />
        ))}
      </div>
    </div>
  );
}
