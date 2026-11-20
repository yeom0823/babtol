import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { authEnv } from "./env";

/** 로그인해야만 들어갈 수 있는 주소. 지금은 내 계정(/settings)만 막는다. */
const PROTECTED = ["/settings"];

/**
 * 요청마다 Supabase 세션 쿠키를 갱신한다(Supabase UI Library 블록의 updateSession 기준).
 * 블록은 로그인하지 않은 모든 요청을 막지만, 여기서는 PROTECTED 주소만 로그인 화면으로 보낸다.
 */
export async function updateSession(request: NextRequest) {
  const env = authEnv();
  if (!env) return NextResponse.next({ request });

  let response = NextResponse.next({ request });
  const supabase = createServerClient(env.url, env.key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  // createServerClient와 getClaims 사이에 다른 코드를 넣지 않는다(세션이 끊길 수 있다).
  const { data } = await supabase.auth.getClaims();
  const signedIn = Boolean(data?.claims);

  const path = request.nextUrl.pathname;
  if (!signedIn && PROTECTED.some((p) => path === p || path.startsWith(`${p}/`)) && !path.startsWith("/settings/kidsnote")) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    url.search = `?next=${encodeURIComponent(path)}`;
    return NextResponse.redirect(url);
  }

  // 쿠키가 담긴 response를 그대로 돌려준다.
  return response;
}
