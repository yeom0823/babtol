/**
 * 키즈노트 비공식 웹 내부 API 클라이언트(스펙 "지켜야 할 제약" 참고).
 *
 * 확인한 것: 키즈노트 웹 로그인 화면의 공개 스크립트(2026-11-20)에서, 로그인이 kapi 호스트의
 * POST /web/login/ 에 JSON {username, password}를 보내는 것을 읽었다(www 호스트에는 이 주소가 없다).
 * 미확인: 2단계 인증 계정의 응답 필드(enabled, phone)와 2단계 요청 본문은 추정이다.
 * 실제 로그인 응답은 계정으로 연결해 보기 전까지 확인하지 못했다.
 */

const API = "https://kapi.kidsnote.com";

export class KidsnoteAuthError extends Error {}

export type LoginResult =
  | { kind: "ok"; cookie: string }
  | { kind: "needs-code"; phone: string }
  | { kind: "failed" };

export type KidsnoteDayMenu = {
  morningSnack: string[];
  lunch: string[];
  afternoonSnack: string[];
  photos?: Partial<Record<"morningSnack" | "lunch" | "afternoonSnack", string>>;
};

const isUrl = (v: unknown): v is string => typeof v === "string" && /^https?:\/\//.test(v);

/**
 * 식단 항목의 사진(*_img). 스펙에는 "원본·큰 사진·240px, 없으면 null"로만 적혀 있어 모양을 모른다.
 * 주소 문자열이면 그대로, 크기별 객체면 큰 사진 → 원본 → 그 밖의 주소 순으로 고른다.
 */
function photoUrl(value: unknown): string | null {
  if (isUrl(value)) return value;
  if (!value || typeof value !== "object") return null;
  const obj = value as Record<string, unknown>;
  for (const key of ["large", "original"]) if (isUrl(obj[key])) return obj[key];
  const rest = Object.entries(obj).filter(([k, v]) => isUrl(v) && !/small|thumb|240/i.test(k));
  return (rest[0]?.[1] as string | undefined) ?? null;
}

function cookieFrom(res: Response): string {
  return res.headers
    .getSetCookie()
    .map((c) => c.split(";")[0])
    .join("; ");
}

/** 비밀번호는 이 요청 한 번에만 쓰고 어디에도 남기지 않는다. */
export async function login(
  { username, password }: { username: string; password: string },
  f: typeof fetch = fetch
): Promise<LoginResult> {
  const factor = await f(`${API}/v1/second-factors/${encodeURIComponent(username)}/`);
  if (factor.ok) {
    const info = (await factor.json().catch(() => ({}))) as { enabled?: boolean; phone?: string };
    if (info.enabled) {
      await f(`${API}/v1/second-factor-login/send-code/`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username }),
      });
      return { kind: "needs-code", phone: info.phone ?? "" };
    }
  }
  const res = await f(`${API}/web/login/`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ username, password }),
    redirect: "manual",
  });
  const cookie = cookieFrom(res);
  if (res.status >= 400 || !cookie) return { kind: "failed" };
  return { kind: "ok", cookie };
}

/** 2단계 인증 코드를 확인하고 세션 쿠키를 받는다. */
export async function submitCode(
  username: string,
  code: string,
  f: typeof fetch = fetch
): Promise<LoginResult> {
  const res = await f(`${API}/v1/second-factor-login/credentials/`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ username, code }),
  });
  const cookie = cookieFrom(res);
  if (!res.ok || !cookie) return { kind: "failed" };
  return { kind: "ok", cookie };
}

/** 계정 정보 응답 어디에 있든 센터 ID를 찾는다. */
export function findCenterId(json: unknown): string | null {
  if (!json || typeof json !== "object") return null;
  const obj = json as Record<string, unknown>;
  if (typeof obj.center_id === "number" || typeof obj.center_id === "string") {
    return String(obj.center_id);
  }
  const center = obj.center;
  if (center && typeof center === "object") {
    const id = (center as Record<string, unknown>).id;
    if (typeof id === "number" || typeof id === "string") return String(id);
  }
  for (const value of Object.values(obj)) {
    const found = findCenterId(value);
    if (found) return found;
  }
  return null;
}

export async function fetchCenterId(cookie: string, f: typeof fetch = fetch): Promise<string | null> {
  for (const path of ["/v1/me/info/", "/v1/children/"]) {
    const res = await f(`${API}${path}`, { headers: { cookie } });
    if (res.status === 401) throw new KidsnoteAuthError();
    if (!res.ok) continue;
    const id = findCenterId(await res.json());
    if (id) return id;
  }
  return null;
}

const lines = (s: unknown) =>
  typeof s === "string" ? s.split("\n").map((x) => x.trim()).filter(Boolean) : [];

/** 기간의 어린이집 식단을 날짜별로 받는다. 점심이 없는 날은 식단으로 세지 않는다. */
export async function fetchMenus(
  cookie: string,
  centerId: string,
  start: string,
  end: string,
  f: typeof fetch = fetch
): Promise<Record<string, KidsnoteDayMenu>> {
  const menus: Record<string, KidsnoteDayMenu> = {};
  let url: string | null =
    `${API}/v1/centers/${centerId}/menu/?start_date=${start}&end_date=${end}&page=1&page_size=31`;
  while (url) {
    const res = await f(url, { headers: { cookie } });
    if (res.status === 401) throw new KidsnoteAuthError();
    if (!res.ok) throw new Error(`키즈노트 식단 요청 실패 (${res.status})`);
    const body = (await res.json()) as { next?: string | null; results?: Record<string, unknown>[] };
    for (const item of body.results ?? []) {
      const lunch = lines(item.lunch);
      if (!lunch.length || typeof item.date_menu !== "string") continue;
      const photos = Object.fromEntries(
        (
          [
            ["morningSnack", photoUrl(item.morning_snack_img)],
            ["lunch", photoUrl(item.lunch_img)],
            ["afternoonSnack", photoUrl(item.afternoon_snack_img)],
          ] as const
        ).filter(([, url]) => url)
      );
      menus[item.date_menu] = {
        morningSnack: lines(item.morning_snack),
        lunch,
        afternoonSnack: lines(item.afternoon_snack),
        ...(Object.keys(photos).length ? { photos } : {}),
      };
    }
    url = body.next ?? null;
  }
  return menus;
}
