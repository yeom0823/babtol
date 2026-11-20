import {
  ocrImages,
  readMenusFromImages,
  readMenusFromText,
  textFromLink,
  type ReadDay,
} from "@/features/menu-reading";
import { toISODate } from "@/lib/date";
import { visionModel } from "@/lib/llm";

/**
 * 식단표 사진(여러 장)이나 링크를 받아 날짜별 메뉴를 읽는다. 저장하지 않고 읽은 결과만 돌려준다.
 * 사진은 서버 액션의 본문 크기 제한을 넘기 쉬워서 Route Handler로 받는다.
 *
 * 자체 호스팅 Ollama에 비전 모델(OLLAMA_VISION_MODEL)이 있으면 사진을 직접 읽게 하고, 실패하거나 아무것도
 * 못 읽으면 OCR로 글자를 뽑아 텍스트 모델로 정리하는 기존 방식으로 넘어간다.
 */
export async function POST(request: Request) {
  const form = await request.formData();
  const photos = form.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0);
  const url = String(form.get("url") ?? "").trim();
  const today = toISODate(new Date());

  let images: Buffer[] = [];
  if (photos.length) {
    images = await Promise.all(photos.map(async (f) => Buffer.from(await f.arrayBuffer())));
  } else if (/^https?:\/\//.test(url) && visionModel) {
    images = await imageAt(url);
  }

  if (images.length && visionModel) {
    try {
      const days = await readMenusFromImages(images, today, visionModel);
      if (days.length) return Response.json({ days });
    } catch (e) {
      console.info("비전 모델로 식단표 읽기 실패, OCR로 넘어감:", e instanceof Error ? e.message : e);
    }
  }

  let text = "";
  try {
    if (images.length) text = await ocrImages(images);
    else if (/^https?:\/\//.test(url)) text = await textFromLink(url);
  } catch (e) {
    console.error("식단표 글자 읽기 실패:", e instanceof Error ? e.message : e);
  }
  const days: ReadDay[] = await readMenusFromText(text, today);
  return Response.json({ days });
}

/** 링크가 이미지 주소이면 그 이미지를, 아니면 빈 목록을 준다(웹페이지는 기존 방식으로 읽는다). */
async function imageAt(url: string): Promise<Buffer[]> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(20_000) });
    if (!res.ok || !(res.headers.get("content-type") ?? "").startsWith("image/")) return [];
    return [Buffer.from(await res.arrayBuffer())];
  } catch {
    return [];
  }
}
