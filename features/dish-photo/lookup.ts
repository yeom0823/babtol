import { readStore, updateStore } from "@/lib/local-store";

const KEY = "dishPhotos";
const squash = (s: string) => s.replace(/\s+/g, "");
type Cache = Record<string, string | null>;

/**
 * 식약처 식품안전나라 조리식품 레시피 DB(COOKRCP01)에 이름이 같은 요리가 있으면 그 사진 주소를 준다.
 * 없으면 null이라 화면이 사진 자리를 비운 기본 모양을 보여 준다. 찾은 결과(없음 포함)는 저장해
 * 다시 요청하지 않는다. 인증키는 FOODSAFETY_API_KEY(.env.local)에서 읽고, 없거나 실패하면 사진 없이 넘어간다.
 */
export async function photoFor(name: string, f: typeof fetch = fetch): Promise<string | null> {
  const key = process.env.FOODSAFETY_API_KEY;
  if (!key) return null;
  const cache = await readStore<Cache>(KEY, {});
  if (name in cache) return cache[name];
  try {
    const url = `http://openapi.foodsafetykorea.go.kr/api/${key}/COOKRCP01/json/1/20/RCP_NM=${encodeURIComponent(name)}`;
    const res = await f(url, { signal: AbortSignal.timeout(8_000) });
    if (!res.ok) return null;
    const body = (await res.json()) as {
      COOKRCP01?: { row?: { RCP_NM?: string; ATT_FILE_NO_MAIN?: string }[] };
    };
    const hit = body.COOKRCP01?.row?.find((r) => r.RCP_NM && squash(r.RCP_NM) === squash(name));
    const photo = hit?.ATT_FILE_NO_MAIN?.trim() || null;
    await updateStore<Cache>(KEY, {}, (c) => ({ ...c, [name]: photo }));
    return photo;
  } catch {
    // 일시적 실패는 저장하지 않아 다음에 다시 찾는다.
    return null;
  }
}
