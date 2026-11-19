import { ocrImages, readMenusFromText, textFromLink } from "@/features/menu-reading";
import { toISODate } from "@/lib/date";

/**
 * 식단표 사진(여러 장)이나 링크를 받아 날짜별 메뉴를 읽는다. 저장하지 않고 읽은 결과만 돌려준다.
 * 사진은 서버 액션의 본문 크기 제한을 넘기 쉬워서 Route Handler로 받는다.
 */
export async function POST(request: Request) {
  const form = await request.formData();
  const photos = form.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0);
  const url = String(form.get("url") ?? "").trim();

  let text = "";
  try {
    if (photos.length) {
      text = await ocrImages(await Promise.all(photos.map(async (f) => Buffer.from(await f.arrayBuffer()))));
    } else if (/^https?:\/\//.test(url)) {
      text = await textFromLink(url);
    }
  } catch (e) {
    console.error("식단표 글자 읽기 실패:", e instanceof Error ? e.message : e);
  }
  const days = await readMenusFromText(text, toISODate(new Date()));
  return Response.json({ days });
}
