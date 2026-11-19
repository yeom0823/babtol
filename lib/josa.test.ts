import { expect, test } from "vitest";

import { josa } from "@/lib/josa";

test("받침에 맞는 조사를 붙인다", () => {
  expect(josa("귤", "을", "를")).toBe("귤을");
  expect(josa("바나나", "을", "를")).toBe("바나나를");
  expect(josa("미역국", "은", "는")).toBe("미역국은");
});
