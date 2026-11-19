import { expect, test } from "vitest";

import { formatDayMenu, parseDayMenu, parseDishList } from "./menu-text";

test("메뉴 글은 쉼표와 줄바꿈으로 나누고 빈 칸은 버린다", () => {
  expect(parseDishList("잡곡밥, 두부장국,\n생선까스 ,, 양배추무침")).toEqual([
    "잡곡밥",
    "두부장국",
    "생선까스",
    "양배추무침",
  ]);
});

test("하루 식단 글에서 점심과 오전·오후 간식을 읽는다", () => {
  const text = "점심 · 잡곡밥, 두부장국\n간식 · 씨리얼, 우유 / 잼샌드위치";
  expect(parseDayMenu(text)).toEqual({
    lunch: ["잡곡밥", "두부장국"],
    morningSnack: ["씨리얼", "우유"],
    afternoonSnack: ["잼샌드위치"],
  });
});

test("간식 줄이 없어도 점심만으로 읽힌다", () => {
  expect(parseDayMenu("점심 · 잡곡밥, 두부장국")).toEqual({
    lunch: ["잡곡밥", "두부장국"],
    morningSnack: [],
    afternoonSnack: [],
  });
});

test("점심이 하나도 없으면 읽지 못한 것이다", () => {
  expect(parseDayMenu("간식 · 사과")).toBeNull();
  expect(parseDayMenu("")).toBeNull();
});

test("formatDayMenu로 쓴 글을 parseDayMenu가 그대로 읽는다", () => {
  const menu = {
    lunch: ["카레라이스", "단무지"],
    morningSnack: ["요거트"],
    afternoonSnack: ["찐 고구마"],
  };
  expect(parseDayMenu(formatDayMenu(menu))).toEqual(menu);
});
