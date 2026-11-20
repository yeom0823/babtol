import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { authEnv } from "./env";

/** 로그인 없이 들어갈 수 있는 주소. 데이터가 가족별로 나뉘어 나머지는 모두 로그인해야 한다. */
const PUBLIC = ["/auth"];

/**
 * 요청마다 Supabase 세션 쿠키를 갱신하고(Supabase UI Library 블록의 updateSession 기준),
 * 로그인하지 않은 요청은 원래 가려던 주소를 next에 담아 로그인 화면으로 보낸다.
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
  if (!signedIn && !PUBLIC.some((p) => path === p || path.startsWith(`${p}/`))) {
    // API 요청은 화면 이동 대신 401로 답한다.
    if (path.startsWith("/api/")) return NextResponse.json({ error: "로그인이 필요해요" }, { status: 401 });
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    url.search = `?next=${encodeURIComponent(path + request.nextUrl.search)}`;
    return NextResponse.redirect(url);
  }

  // 쿠키가 담긴 response를 그대로 돌려준다.
  return response;
}
