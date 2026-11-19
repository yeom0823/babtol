/**
 * 키즈노트 비공식 웹 내부 API 클라이언트(스펙 "지켜야 할 제약" 참고).
 *
 * 미확인 가정: 요청 본문 형식(로그인은 username·password 폼 전송, 2단계 인증은 JSON)과
 * 2단계 인증 응답의 필드 이름(enabled, phone)은 스펙에 적힌 엔드포인트만 근거로 한 추정이다.
 * 실제 계정으로 연결해 보기 전까지 검증되지 않았다.
 */

const WEB = "https://www.kidsnote.com";
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
};

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
  const res = await f(`${WEB}/web/login/`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ username, password }),
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
      menus[item.date_menu] = {
        morningSnack: lines(item.morning_snack),
        lunch,
        afternoonSnack: lines(item.afternoon_snack),
      };
    }
    url = body.next ?? null;
  }
  return menus;
}
