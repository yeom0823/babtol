"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { STARTED_COOKIE } from "./started";

/** 랜딩에서 "시작하기"를 누르면 이 기기는 다음부터 바로 오늘 화면으로 간다. */
export async function startAction() {
  (await cookies()).set(STARTED_COOKIE, "1", {
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
    sameSite: "lax",
    httpOnly: true,
  });
  redirect("/");
}
