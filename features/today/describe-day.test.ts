import { expect, test } from "vitest";

import { describeDay } from "./describe-day";

const today = "2026-11-17";

test("오늘이면 상대 표현 없이 월일과 요일만 쓴다", () => {
  expect(describeDay("2026-11-17", today)).toEqual({
    label: "11월 17일 화요일",
    relative: "",
    note: null,
  });
});

test("어제와 내일은 이름으로, 그 밖은 일수로 쓴다", () => {
  expect(describeDay("2026-11-16", today).relative).toBe("어제");
  expect(describeDay("2026-11-18", today).relative).toBe("내일");
  expect(describeDay("2026-11-12", today).relative).toBe("5일 전");
  expect(describeDay("2026-11-23", today).relative).toBe("6일 뒤");
});

test("지난 날과 앞으로의 날에는 각각 안내 문구가 붙는다", () => {
  expect(describeDay("2026-11-16", today).note).toBe(
    "지난 끼니예요. 먹인 반응을 지금 눌러도 돼요."
  );
  expect(describeDay("2026-11-18", today).note).toBe(
    "미리 보는 추천이에요. 장 볼 때 참고하세요."
  );
});
