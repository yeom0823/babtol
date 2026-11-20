/**
 * 로그인에 쓰는 Supabase 공개 설정. 브라우저에 보내도 되는 Project URL과 publishable 키만 쓴다.
 * 둘 중 하나라도 없으면 로그인 기능을 끈 채로 앱이 돈다(예전처럼 로그인 없이 쓴다).
 */
export function authEnv(): { url: string; key: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  return url && key ? { url, key } : null;
}
