import { expect, test } from "vitest";

import { mealAtHour } from "./meal-time";

test("오전 10시 전은 아침, 오후 3시 전은 점심, 오후 5시 전은 간식, 그 뒤는 저녁이다", () => {
  expect(mealAtHour(7)).toBe("breakfast");
  expect(mealAtHour(9)).toBe("breakfast");
  expect(mealAtHour(10)).toBe("lunch");
  expect(mealAtHour(14)).toBe("lunch");
  expect(mealAtHour(15)).toBe("snack");
  expect(mealAtHour(16)).toBe("snack");
  expect(mealAtHour(17)).toBe("dinner");
  expect(mealAtHour(22)).toBe("dinner");
});
