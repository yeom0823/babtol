import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, expect, test, vi } from "vitest";

import { getMenu, saveMenus } from "@/features/daycare-menu/server";
import { connectionStatus, connectWithPassword } from "@/features/kidsnote";

import { syncDaycareMenus } from "./sync";

let dir: string;
beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), "daycare-sync-"));
  process.env.HOME_MEAL_DATA_FILE = join(dir, "data.json");
});
afterEach(async () => {
  delete process.env.HOME_MEAL_DATA_FILE;
  await rm(dir, { recursive: true, force: true });
});

function fakeKidsnote(opts: { menuStatus?: number } = {}) {
  const calls: string[] = [];
  const f = (async (url: RequestInfo | URL) => {
    const u = String(url);
    calls.push(u);
    if (u.includes("/v1/second-factors/")) return new Response(JSON.stringify({ enabled: false }));
    if (u.includes("/web/login/")) return new Response("{}", { headers: [["set-cookie", "sessionid=a"]] });
    if (u.includes("/v1/me/info/")) return new Response(JSON.stringify({ center: { id: 7 } }));
    if (u.includes("/menu/")) {
      if (opts.menuStatus) return new Response("{}", { status: opts.menuStatus });
      return new Response(
        JSON.stringify({
          results: [
            { date_menu: "2026-11-17", lunch: "잡곡밥\n두부장국", morning_snack: "우유", afternoon_snack: "" },
            { date_menu: "2026-11-18", lunch: "카레라이스", morning_snack: "", afternoon_snack: "" },
          ],
        })
      );
    }
    return new Response("{}", { status: 404 });
  }) as typeof fetch;
  return { f, calls, menuCalls: () => calls.filter((c) => c.includes("/menu/")).length };
}

test("연결 전에는 아무것도 가져오지 않는다", async () => {
  const k = fakeKidsnote();
  expect(await syncDaycareMenus("2026-11-17", k.f)).toBe("none");
  expect(k.menuCalls()).toBe(0);
});

test("연결되어 있으면 이번 주와 다음 주 식단을 가져와 저장한다 (AC1)", async () => {
  const k = fakeKidsnote();
  await connectWithPassword("mom", "pw", k.f);
  expect(await syncDaycareMenus("2026-11-17", k.f)).toBe("synced");
  expect(await getMenu("2026-11-17")).toMatchObject({ lunch: ["잡곡밥", "두부장국"], source: "kidsnote" });
  expect(k.calls.find((c) => c.includes("/menu/"))).toContain("start_date=2026-11-16&end_date=2026-11-29");
});

test("사용자가 올려 고친 식단은 키즈노트가 덮어쓰지 않는다", async () => {
  const k = fakeKidsnote();
  await connectWithPassword("mom", "pw", k.f);
  await saveMenus({ "2026-11-17": { lunch: ["내가 고친 점심"], morningSnack: [], afternoonSnack: [] } }, "upload");
  await syncDaycareMenus("2026-11-17", k.f);
  expect((await getMenu("2026-11-17"))?.lunch).toEqual(["내가 고친 점심"]);
  expect((await getMenu("2026-11-18"))?.source).toBe("kidsnote");
});

test("세션이 만료되어 401이 오면 연결 만료로 표시한다 (AC3)", async () => {
  const k = fakeKidsnote({ menuStatus: 401 });
  await connectWithPassword("mom", "pw", k.f);
  expect(await syncDaycareMenus("2026-11-17", k.f)).toBe("expired");
  expect(await connectionStatus()).toBe("expired");
});

const at = (time: string) => vi.setSystemTime(new Date(`2026-11-17T${time}:00Z`));

test("화면을 열 때는 1시간에 한 번만 가져온다", async () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  try {
    at("01:00");
    const k = fakeKidsnote();
    await connectWithPassword("mom", "pw", k.f);
    await syncDaycareMenus("2026-11-17", k.f);
    at("01:59");
    expect(await syncDaycareMenus("2026-11-17", k.f)).toBe("recent");
    at("02:01");
    expect(await syncDaycareMenus("2026-11-17", k.f)).toBe("synced");
    expect(k.menuCalls()).toBe(2);
  } finally {
    vi.useRealTimers();
  }
});

test("새로 가져오기 버튼도 마지막으로 가져온 지 5분이 안 됐으면 키즈노트를 부르지 않는다", async () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  try {
    at("01:00");
    const k = fakeKidsnote();
    await connectWithPassword("mom", "pw", k.f);
    await syncDaycareMenus("2026-11-17", k.f);
    at("01:04");
    expect(await syncDaycareMenus("2026-11-17", k.f, { force: true })).toBe("recent");
    expect(k.menuCalls()).toBe(1);
    at("01:06");
    expect(await syncDaycareMenus("2026-11-17", k.f, { force: true })).toBe("synced");
    expect(k.menuCalls()).toBe(2);
  } finally {
    vi.useRealTimers();
  }
});
