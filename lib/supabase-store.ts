import { createClient } from "@supabase/supabase-js";

const TABLE = "app_store";

/**
 * Supabase의 app_store 표(키별 JSON)에 읽고 쓴다. 배포 환경에서 서버가 바뀌거나 재배포돼도
 * 데이터가 남게 한다. 앱에 로그인이 없어서 서버만 비밀 키(SUPABASE_SECRET_KEY)로 접근하고,
 * 이 키는 NEXT_PUBLIC_ 이름을 쓰지 않아 브라우저로 나가지 않는다.
 */
export function createSupabaseStore({
  url,
  secretKey,
  fetch: customFetch,
}: {
  url: string;
  secretKey: string;
  fetch?: typeof fetch;
}) {
  const db = createClient(url, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    ...(customFetch ? { global: { fetch: customFetch } } : {}),
  });

  return {
    /** 저장한 적 없는 키는 undefined. */
    async read(key: string): Promise<unknown> {
      const { data, error } = await db.from(TABLE).select("value").eq("key", key).limit(1);
      if (error) throw new Error(`저장소 읽기 실패: ${error.message}`);
      return data?.[0]?.value;
    },
    async write(key: string, value: unknown): Promise<void> {
      // value 칸은 비울 수 없다. null은 "값 없음"이라 행을 지우고, 다시 읽으면 기본값이 나온다.
      if (value === null || value === undefined) {
        const { error } = await db.from(TABLE).delete().eq("key", key);
        if (error) throw new Error(`저장소 지우기 실패: ${error.message}`);
        return;
      }
      const { error } = await db
        .from(TABLE)
        .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: "key" });
      if (error) throw new Error(`저장소 쓰기 실패: ${error.message}`);
    },
  };
}
