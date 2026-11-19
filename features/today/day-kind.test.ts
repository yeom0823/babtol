import { expect, test } from "vitest";

import { dayKind } from "./day-kind";

const menu = { lunch: ["잡곡밥"], morningSnack: [], afternoonSnack: [] };

test("평일에 어린이집 식단이 있으면 어린이집 날이다", () => {
  expect(dayKind("2026-11-17", menu)).toBe("daycare");
});

test("평일인데 식단이 없으면 식단 없는 날이다", () => {
  expect(dayKind("2026-11-17", null)).toBe("missing");
});

test("주말은 식단이 있어도 쉬는 날이다", () => {
  expect(dayKind("2026-11-21", null)).toBe("off");
  expect(dayKind("2026-11-22", menu)).toBe("off");
});
