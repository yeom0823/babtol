/**
 * 로그인 뒤 돌아갈 주소가 같은 사이트 안의 경로일 때만 쓴다(Supabase UI Library safe-next-path 기준).
 * 다른 사이트로 보내는 주소("//evil.com" 등)는 fallback으로 바꾼다.
 */
export const safeNextPath = (path: unknown, fallback: string, origin: string) => {
  if (typeof path !== "string" || !path.startsWith("/")) return fallback;
  try {
    const url = new URL(path, origin);
    return url.origin === origin ? `${url.pathname}${url.search}${url.hash}` : fallback;
  } catch {
    return fallback;
  }
};
