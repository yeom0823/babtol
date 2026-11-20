"use server";

import { redirect } from "next/navigation";

import { syncDaycareMenus } from "@/features/daycare-sync";
import { connectWithCode, connectWithPassword, disconnect, type ConnectResult } from "@/features/kidsnote";
import { toISODate } from "@/lib/date";

/** 화면이 그릴 연결 단계. 비밀번호는 어디에도 담지 않는다. */
export type ConnectState =
  | { step: "login"; failed: boolean }
  | { step: "code"; phone: string; failed: boolean };

async function next(result: ConnectResult, step: "login" | "code", phone = ""): Promise<ConnectState> {
  if (result.kind === "connected") {
    await syncDaycareMenus(toISODate(new Date()), fetch, { force: true });
    redirect("/");
  }
  if (result.kind === "needs-code") return { step: "code", phone: result.phone, failed: false };
  return step === "code" ? { step: "code", phone, failed: true } : { step: "login", failed: true };
}

export async function connect(_prev: ConnectState, formData: FormData): Promise<ConnectState> {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!username || !password) return { step: "login", failed: true };
  return next(await connectWithPassword(username, password), "login");
}

export async function submitCode(prev: ConnectState, formData: FormData): Promise<ConnectState> {
  const code = String(formData.get("code") ?? "").trim();
  const phone = prev.step === "code" ? prev.phone : "";
  if (!/^\d{6}$/.test(code)) return { step: "code", phone, failed: true };
  return next(await connectWithCode(code), "code", phone);
}

/** 키즈노트 연결 끊기. 이미 가져온 식단은 남겨 둔다. */
export async function disconnectAction(): Promise<void> {
  await disconnect();
  redirect("/kid");
}
