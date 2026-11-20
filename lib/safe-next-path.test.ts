import { expect, test } from "vitest";

import { safeNextPath } from "./safe-next-path";

const origin = "https://babtol.vercel.app";

test("같은 사이트 안의 경로는 그대로 쓴다", () => {
  expect(safeNextPath("/kid?x=1", "/", origin)).toBe("/kid?x=1");
});

test("다른 사이트로 가는 주소나 빈 값은 기본 주소로 바꾼다", () => {
  expect(safeNextPath("//evil.example/kid", "/kid", origin)).toBe("/kid");
  expect(safeNextPath("https://evil.example", "/kid", origin)).toBe("/kid");
  expect(safeNextPath(null, "/kid", origin)).toBe("/kid");
});
