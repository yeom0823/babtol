import { expect, test } from "vitest";

import { addDays, isWeekend, toISODate, weekOf } from "@/lib/date";

test("toISODate는 로컬 날짜를 YYYY-MM-DD로 쓴다", () => {
  expect(toISODate(new Date(2026, 10, 7))).toBe("2026-11-07");
});

test("weekOf는 날짜가 속한 주의 월요일부터 일요일까지 7일을 준다", () => {
  expect(weekOf("2026-11-19")).toEqual([
    "2026-11-16",
    "2026-11-17",
    "2026-11-18",
    "2026-11-19",
    "2026-11-20",
    "2026-11-21",
    "2026-11-22",
  ]);
  expect(weekOf("2026-11-22")[0]).toBe("2026-11-16");
});

test("addDays는 달을 넘겨 더한다", () => {
  expect(addDays("2026-11-30", 1)).toBe("2026-12-01");
  expect(addDays("2026-11-01", -1)).toBe("2026-10-31");
});

test("isWeekend는 토요일과 일요일만 참이다", () => {
  expect(isWeekend("2026-11-21")).toBe(true);
  expect(isWeekend("2026-11-22")).toBe(true);
  expect(isWeekend("2026-11-20")).toBe(false);
});
