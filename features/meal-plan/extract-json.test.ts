import { expect, test } from "vitest";

import { extractJson } from "./extract-json";

test("앞뒤에 설명이 붙은 답에서 JSON 객체를 꺼낸다", () => {
  expect(extractJson('여기 있어요:\n{"a": 1, "b": {"c": 2}}\n맛있게 드세요')).toEqual({ a: 1, b: { c: 2 } });
});

test("코드 블록으로 감싼 JSON도 꺼낸다", () => {
  expect(extractJson('```json\n{"a": [1, 2]}\n```')).toEqual({ a: [1, 2] });
});

test("문자열 안의 중괄호에 속지 않는다", () => {
  expect(extractJson('{"a": "}{", "b": 1}')).toEqual({ a: "}{", b: 1 });
});

test("JSON이 없거나 깨졌으면 null이다", () => {
  expect(extractJson("추천을 만들 수 없어요")).toBeNull();
  expect(extractJson('{"a": ')).toBeNull();
});
