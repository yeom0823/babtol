import type { NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/proxy-session";

/** Next.js 16의 proxy(예전 middleware): 요청마다 로그인 세션을 갱신한다. */
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
