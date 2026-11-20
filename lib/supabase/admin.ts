import { createClient } from "@supabase/supabase-js";

/**
 * 서버 전용 Supabase 클라이언트(비밀 키). 가족·아이·저장소 표는 RLS로 막혀 있어서 이 클라이언트로만 접근한다.
 * 어느 가족의 행을 다룰지는 부르는 쪽이 로그인 사용자를 확인해 정해야 한다. 브라우저로 보내지 않는다.
 */
export function createAdminClient() {
  const url = process.env.SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secretKey) return null;
  return createClient(url, secretKey, { auth: { persistSession: false, autoRefreshToken: false } });
}
