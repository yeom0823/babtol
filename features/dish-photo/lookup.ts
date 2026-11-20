import { readStore, updateStore } from "@/lib/local-store";

/** 찾는 방식이 바뀌어서, 예전 방식으로 "없음"이라고 저장한 결과를 버리고 새로 찾도록 키를 바꿨다. */
const KEY = "dishPhotos:v3";
const MAX_REQUESTS = 4;
const squash = (s: string) => s.replace(/\s+/g, "");
type Cache = Record<string, string | null>;
type Row = { RCP_NM?: string; ATT_FILE_NO_MAIN?: string };

/**
 * 검색어 후보. 이름 그대로, 마지막 단어, 붙여 쓴 이름의 끝 3글자·2글자 순서로 찾는다.
 * 요리 종류(채소죽, 미역국, 나물)는 이름 뒤쪽에 오므로 뒤쪽만 쓴다. 앞쪽 재료 이름(닭가슴살)으로
 * 찾으면 같은 재료의 다른 요리 사진이 붙어 버린다.
 */
function keywords(name: string): string[] {
  const whole = squash(name);
  if (whole.length < 2) return [name.trim()];
  const last = name.trim().split(/\s+/).at(-1)!;
  const tails = [3, 2].filter((n) => whole.length > n).map((n) => whole.slice(-n));
  return [...new Set([name.trim(), ...(last.length >= 2 ? [last] : []), ...tails])].slice(0, MAX_REQUESTS);
}

/** 이름이 같은 레시피가 있으면 그것을, 없으면 검색어가 들어간 레시피 중 이름이 가장 짧은 것을 고른다. */
function pick(rows: Row[], name: string, keyword: string): string | null {
  const withPhoto = rows.filter((r) => r.RCP_NM && r.ATT_FILE_NO_MAIN?.trim());
  const exact = withPhoto.find((r) => squash(r.RCP_NM!) === squash(name));
  if (exact) return exact.ATT_FILE_NO_MAIN!.trim();
  if (squash(name).length < 2) return null;
  const near = withPhoto
    .filter((r) => squash(r.RCP_NM!).includes(squash(keyword)))
    .sort((a, b) => squash(a.RCP_NM!).length - squash(b.RCP_NM!).length)[0];
  return near?.ATT_FILE_NO_MAIN?.trim() ?? null;
}

/**
 * 식약처 식품안전나라 조리식품 레시피 DB(COOKRCP01)에서 메뉴 사진을 찾는다. 이름이 정확히 같은 요리가
 * 없으면 핵심 단어(채소죽, 미역국 같은 요리 종류)로 비슷한 요리 사진을 쓴다. 그래도 없으면 null이라
 * 화면이 사진 자리를 비운 기본 모양을 보여 준다. 찾은 결과(없음 포함)는 저장해 다시 요청하지 않는다.
 * 인증키는 FOODSAFETY_API_KEY에서 읽고, 없거나 실패하면 사진 없이 넘어간다.
 */
export async function photoFor(name: string, f: typeof fetch = fetch): Promise<string | null> {
  const key = process.env.FOODSAFETY_API_KEY;
  if (!key) return null;
  const cache = await readStore<Cache>(KEY, {});
  if (name in cache) return cache[name];
  let photo: string | null = null;
  try {
    for (const keyword of keywords(name)) {
      const url = `http://openapi.foodsafetykorea.go.kr/api/${key}/COOKRCP01/json/1/20/RCP_NM=${encodeURIComponent(keyword)}`;
      const res = await f(url, { signal: AbortSignal.timeout(8_000) });
      if (!res.ok) return null;
      const body = (await res.json()) as { COOKRCP01?: { row?: Row[] } };
      photo = pick(body.COOKRCP01?.row ?? [], name, keyword);
      if (photo) break;
    }
  } catch {
    // 일시적 실패는 저장하지 않아 다음에 다시 찾는다.
    return null;
  }
  await updateStore<Cache>(KEY, {}, (c) => ({ ...c, [name]: photo }));
  return photo;
}
