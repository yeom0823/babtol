import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { cache } from "react";

import { authEnv } from "./env";

/**
 * 서버용 Supabase 클라이언트(Supabase UI Library Social Auth 블록 기준). 요청마다 새로 만든다.
 * 로그인 설정이 없으면 null. 세션 쿠키 갱신은 proxy.ts가 맡는다.
 */
export async function createClient() {
  const env = authEnv();
  if (!env) return null;
  const cookieStore = await cookies();
  return createServerClient(env.url, env.key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // 서버 컴포넌트에서는 쿠키를 쓸 수 없다. proxy.ts가 세션을 갱신하므로 무시한다.
        }
      },
    },
  });
}

/**
 * 서버가 확인한 지금 로그인한 사람. 로그인하지 않았거나 로그인 설정이 없으면 null.
 * 한 요청 안에서 여러 번 불려도(레이아웃, 페이지, 저장소) 한 번만 확인한다.
 */
export const currentUser = cache(async (): Promise<{ id: string; email: string | null } | null> => {
  const supabase = await createClient();
  if (!supabase) return null;
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  return claims?.sub ? { id: claims.sub, email: typeof claims.email === "string" ? claims.email : null } : null;
});
