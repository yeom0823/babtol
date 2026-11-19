import { expect, test } from "vitest";

import { KidsnoteAuthError, fetchMenus, findCenterId, login } from "./client";

const json = (body: unknown, init: ResponseInit = {}) =>
  new Response(JSON.stringify(body), { status: 200, ...init });

test("로그인에 성공하면 응답 쿠키를 세션으로 돌려준다", async () => {
  const f = async () =>
    new Response("{}", {
      status: 200,
      headers: [
        ["set-cookie", "sessionid=abc; Path=/; HttpOnly"],
        ["set-cookie", "csrftoken=xyz; Path=/"],
      ],
    });
  expect(await login({ username: "u", password: "p" }, f as typeof fetch)).toEqual({
    kind: "ok",
    cookie: "sessionid=abc; csrftoken=xyz",
  });
});

test("아이디나 비밀번호가 틀리면 실패로 돌려준다", async () => {
  const f = async () => new Response("{}", { status: 400 });
  expect(await login({ username: "u", password: "wrong" }, f as typeof fetch)).toEqual({
    kind: "failed",
  });
});

test("2단계 인증 계정은 코드를 보내고 코드 입력이 필요하다고 알려 준다", async () => {
  const urls: string[] = [];
  const f = async (url: RequestInfo | URL) => {
    urls.push(String(url));
    if (String(url).includes("/v1/second-factors/")) return json({ enabled: true, phone: "010-****-5821" });
    return json({});
  };
  const result = await login({ username: "u", password: "p" }, f as typeof fetch);
  expect(result).toEqual({ kind: "needs-code", phone: "010-****-5821" });
  expect(urls.some((u) => u.includes("/v1/second-factor-login/send-code/"))).toBe(true);
});

test("식단 응답을 날짜별 하루 식단으로 바꾼다", async () => {
  const f = async () =>
    json({
      count: 1,
      next: null,
      previous: null,
      results: [
        {
          date_menu: "2026-11-17",
          morning_snack: "씨리얼\n유기농우유",
          lunch: "잡곡밥\n두부장국",
          afternoon_snack: "잼샌드위치",
          dinner: "",
          lunch_img: null,
        },
      ],
    });
  expect(await fetchMenus("c=1", "123", "2026-11-17", "2026-11-17", f as typeof fetch)).toEqual({
    "2026-11-17": {
      morningSnack: ["씨리얼", "유기농우유"],
      lunch: ["잡곡밥", "두부장국"],
      afternoonSnack: ["잼샌드위치"],
    },
  });
});

test("점심이 없는 날은 식단으로 세지 않는다", async () => {
  const f = async () =>
    json({ results: [{ date_menu: "2026-11-18", lunch: "", morning_snack: "", afternoon_snack: "" }] });
  expect(await fetchMenus("c=1", "123", "2026-11-18", "2026-11-18", f as typeof fetch)).toEqual({});
});

test("쿠키가 만료되어 401이 오면 인증 오류를 던진다", async () => {
  const f = async () => new Response("{}", { status: 401 });
  await expect(
    fetchMenus("c=1", "123", "2026-11-17", "2026-11-17", f as typeof fetch)
  ).rejects.toBeInstanceOf(KidsnoteAuthError);
});

test("계정 정보 응답 어디에 있든 센터 ID를 찾는다", () => {
  expect(findCenterId({ results: [{ enrollment: { center: { id: 987 } } }] })).toBe("987");
  expect(findCenterId({ center_id: 55 })).toBe("55");
  expect(findCenterId({ nothing: true })).toBeNull();
});
