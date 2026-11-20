import { expect, test } from "vitest";

import type { JsonModel } from "@/lib/llm";

import { readMenusFromImages, readMenusFromText } from "./read-menus";

const OCR = `11월 넷째 주 식단표 (11/23 ~ 11/27)
11/23(월) | 사과, 우유 | 현미밥, 감자국, 제육볶음, 시금치나물, 배주김치 | 떡
11/24(화) | 바나나 | 잡곡밥, 콩나물국, 삼치구이 | 감자전`;

test("글자로 읽은 식단표를 날짜별 메뉴로 바꾸고 짐작한 메뉴를 표시한다 (AC4)", async () => {
  let asked = "";
  const model: JsonModel = async ({ user }) => {
    asked = user;
    return {
      days: [
        {
          date: "2026-11-23",
          morningSnack: ["사과", "우유"],
          lunch: ["현미밥", "감자국", "제육볶음", "시금치나물", "배추김치"],
          afternoonSnack: ["떡"],
          unsure: ["배추김치"],
        },
        { date: "2026-11-24", morningSnack: ["바나나"], lunch: ["잡곡밥", "콩나물국", "삼치구이"], afternoonSnack: ["감자전"] },
      ],
    };
  };
  const days = await readMenusFromText(OCR, "2026-11-19", model);
  expect(asked).toContain("배주김치");
  expect(asked).toContain("2026-11-19");
  expect(days).toEqual([
    {
      date: "2026-11-23",
      menu: { morningSnack: ["사과", "우유"], lunch: ["현미밥", "감자국", "제육볶음", "시금치나물", "배추김치"], afternoonSnack: ["떡"] },
      unsure: ["배추김치"],
    },
    {
      date: "2026-11-24",
      menu: { morningSnack: ["바나나"], lunch: ["잡곡밥", "콩나물국", "삼치구이"], afternoonSnack: ["감자전"] },
      unsure: [],
    },
  ]);
});

test("날짜 형식이 틀리거나 점심이 없는 날은 버린다", async () => {
  const model: JsonModel = async () => ({
    days: [
      { date: "11월 23일", lunch: ["현미밥"] },
      { date: "2026-11-24", lunch: [] },
      { date: "2026-11-25", lunch: ["카레라이스"] },
    ],
  });
  const days = await readMenusFromText("아무 글", "2026-11-19", model);
  expect(days.map((d) => d.date)).toEqual(["2026-11-25"]);
});

test("글이 비었거나 모델이 엉뚱한 답을 주면 읽지 못한 것이다", async () => {
  expect(await readMenusFromText("   ", "2026-11-19", async () => ({ days: [] }))).toEqual([]);
  expect(await readMenusFromText("식단", "2026-11-19", async () => "모르겠어요")).toEqual([]);
  expect(await readMenusFromText("식단", "2026-11-19", async () => { throw new Error("busy"); })).toEqual([]);
});

test("비전 모델이 있으면 사진을 그대로 넘겨 날짜별 메뉴를 읽는다", async () => {
  let seen: { user: string; images?: Uint8Array[] } | null = null;
  const vision: JsonModel = async (p) => {
    seen = p;
    return { days: [{ date: "2026-11-20", lunch: ["백미밥", "미역국"], morningSnack: ["바나나"], afternoonSnack: [] }] };
  };
  const photo = new Uint8Array([1, 2, 3]);
  const days = await readMenusFromImages([photo], "2026-11-19", vision);
  expect(seen!.images).toEqual([photo]);
  expect(seen!.user).toContain("2026-11-19");
  expect(days).toEqual([
    { date: "2026-11-20", menu: { morningSnack: ["바나나"], lunch: ["백미밥", "미역국"], afternoonSnack: [] }, unsure: [] },
  ]);
});

test("비전 모델이 실패하면 빈 결과가 아니라 오류를 내서 OCR로 넘어갈 수 있게 한다", async () => {
  const broken: JsonModel = async () => {
    throw new Error("집 PC 꺼짐");
  };
  await expect(readMenusFromImages([new Uint8Array([1])], "2026-11-19", broken)).rejects.toThrow();
});
