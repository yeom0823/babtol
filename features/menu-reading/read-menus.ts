import { z } from "zod";

import { gatewayModel, type JsonModel } from "@/lib/llm";

export type ReadDay = {
  date: string;
  menu: { morningSnack: string[]; lunch: string[]; afternoonSnack: string[] };
  /** 흐리거나 깨진 글자를 짐작해서 고친 메뉴. 확인 화면에서 색칠해 보여 준다. */
  unsure: string[];
};

const SYSTEM = `당신은 어린이집 식단표를 읽는 도우미입니다. 사진에서 글자 인식(OCR)으로 뽑은 글을 받아,
날짜별 오전간식, 점심, 오후간식 메뉴를 JSON으로 정리합니다.
- 날짜는 YYYY-MM-DD로 씁니다. 연도나 달이 없으면 기준 날짜와 가장 가까운 날짜로 정합니다.
- 메뉴 이름은 식단표에 적힌 그대로 씁니다. 글자 인식이 깨진 것이 분명할 때만 흔한 음식 이름으로 고치고(예: 배주김치 → 배추김치),
  고친 메뉴나 짐작한 메뉴는 unsure에도 넣습니다. 읽을 수 없는 칸은 비워 둡니다.
- 식단표가 아니거나 메뉴를 찾지 못하면 {"days": []}로 답합니다.
- 아래 예시와 같은 키 이름만 쓰는 JSON 객체 하나로 답하고 다른 글은 쓰지 않습니다.
{"days":[{"date":"2026-11-23","morningSnack":["사과","우유"],"lunch":["현미밥","감자국","배추김치"],"afternoonSnack":["떡"],"unsure":["배추김치"]}]}`;

const list = z.array(z.coerce.string()).catch([]);
const schema = z.object({
  days: z.array(
    z.object({
      date: z.string(),
      morningSnack: list,
      lunch: list,
      afternoonSnack: list,
      unsure: list,
    })
  ),
});

const clean = (xs: string[]) => xs.map((x) => x.trim()).filter(Boolean);

/** 글자로 읽은 식단표를 날짜별 메뉴로 바꾼다. 읽지 못하면 빈 목록이다. */
export async function readMenusFromText(
  text: string,
  today: string,
  model: JsonModel = gatewayModel
): Promise<ReadDay[]> {
  if (!text.trim()) return [];
  const raw = await model({
    system: SYSTEM,
    user: `기준 날짜(오늘): ${today}\n\n식단표에서 읽은 글:\n${text.slice(0, 8000)}`,
    // 여러 날의 식단을 한 번에 돌려줘서 답이 길다.
    timeoutMs: 60_000,
  }).catch(() => null);
  return toDays(raw);
}

const VISION_SYSTEM = SYSTEM.replace(
  "사진에서 글자 인식(OCR)으로 뽑은 글을 받아,",
  "식단표 사진을 직접 보고, 표의 칸(요일·날짜별 열과 끼니별 행)을 따라"
);

function toDays(raw: unknown): ReadDay[] {
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return [];
  return parsed.data.days
    .filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d.date) && clean(d.lunch).length > 0)
    .map((d) => ({
      date: d.date,
      menu: {
        morningSnack: clean(d.morningSnack),
        lunch: clean(d.lunch),
        afternoonSnack: clean(d.afternoonSnack),
      },
      unsure: clean(d.unsure),
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * 비전 모델(집 PC의 OLLAMA_VISION_MODEL)이 식단표 사진을 직접 본다. 글자만 뽑는 OCR과 달리
 * 표의 칸 위치를 알아서 월간표도 날짜별로 나눌 수 있다. 실패하면 오류를 그대로 내서
 * 부른 쪽이 OCR로 넘어가게 한다.
 */
export async function readMenusFromImages(
  images: Uint8Array[],
  today: string,
  model: JsonModel
): Promise<ReadDay[]> {
  const raw = await model({
    system: VISION_SYSTEM,
    user: `기준 날짜(오늘): ${today}

첨부한 어린이집 식단표 사진의 날짜별 메뉴를 모두 읽어 주세요.`,
    images,
    timeoutMs: 120_000,
  });
  return toDays(raw);
}
