import { createBrowserClient } from "@supabase/ssr";

import { authEnv } from "./env";

/** 브라우저용 Supabase 클라이언트(Supabase UI Library Social Auth 블록 기준). 로그인 설정이 없으면 null. */
export function createClient() {
  const env = authEnv();
  return env ? createBrowserClient(env.url, env.key) : null;
}
