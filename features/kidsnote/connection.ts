import { readStore, updateStore } from "@/lib/local-store";

import { fetchCenterId, login, submitCode, type LoginResult } from "./client";

export type ConnectionStatus = "none" | "connected" | "expired";

/** 저장하는 것은 세션 쿠키와 센터 ID뿐이다. 비밀번호는 저장하지 않는다. */
type Saved = { cookie: string; centerId: string; expired: boolean } | null;
type Pending = { username: string } | null;

const SESSION = "kidsnoteSession";
const PENDING = "kidsnotePending";

export type ConnectResult =
  | { kind: "connected" }
  | { kind: "needs-code"; phone: string }
  | { kind: "failed" };

export async function connectionStatus(): Promise<ConnectionStatus> {
  const saved = await readStore<Saved>(SESSION, null);
  if (!saved) return "none";
  return saved.expired ? "expired" : "connected";
}

export async function getSession(): Promise<{ cookie: string; centerId: string } | null> {
  const saved = await readStore<Saved>(SESSION, null);
  return saved && !saved.expired ? { cookie: saved.cookie, centerId: saved.centerId } : null;
}

export async function markExpired(): Promise<void> {
  await updateStore<Saved>(SESSION, null, (s) => (s ? { ...s, expired: true } : s));
}

async function finish(result: LoginResult, f: typeof fetch): Promise<ConnectResult> {
  if (result.kind === "failed") return { kind: "failed" };
  if (result.kind === "needs-code") return { kind: "needs-code", phone: result.phone };
  const centerId = await fetchCenterId(result.cookie, f);
  if (!centerId) return { kind: "failed" };
  await updateStore<Saved>(SESSION, null, () => ({ cookie: result.cookie, centerId, expired: false }));
  await updateStore<Pending>(PENDING, null, () => null);
  return { kind: "connected" };
}

export async function connectWithPassword(
  username: string,
  password: string,
  f: typeof fetch = fetch
): Promise<ConnectResult> {
  const result = await login({ username, password }, f);
  if (result.kind === "needs-code") {
    await updateStore<Pending>(PENDING, null, () => ({ username }));
  }
  return finish(result, f);
}

export async function connectWithCode(code: string, f: typeof fetch = fetch): Promise<ConnectResult> {
  const pending = await readStore<Pending>(PENDING, null);
  if (!pending) return { kind: "failed" };
  return finish(await submitCode(pending.username, code, f), f);
}
