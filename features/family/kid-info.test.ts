import { expect, test } from "vitest";

import { describeKids, monthsOld, parseAllergies } from "./kid-info";

test("생년월로 오늘 기준 개월 수를 센다", () => {
  expect(monthsOld("2024-09-01", "2026-11-20")).toBe(26);
  expect(monthsOld("2026-11-01", "2026-11-20")).toBe(0);
  expect(monthsOld(null, "2026-11-20")).toBeNull();
});

test("알레르기는 쉼표나 공백으로 나눠 적어도 하나씩 나눈다", () => {
  expect(parseAllergies("땅콩, 새우  메밀,땅콩")).toEqual(["땅콩", "새우", "메밀"]);
  expect(parseAllergies("  ")).toEqual([]);
});

test("추천에 넘길 아이 설명은 이름과 개월 수를 쓴다", () => {
  expect(
    describeKids(
      [
        { name: "지우", birthMonth: "2024-09-01" },
        { name: "하준", birthMonth: null },
      ],
      "2026-11-20"
    )
  ).toBe("지우(26개월), 하준(개월 수 모름)");
  expect(describeKids([], "2026-11-20")).toBeNull();
});
