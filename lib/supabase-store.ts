import { createClient } from "@supabase/supabase-js";

const TABLE = "app_store";

/**
 * Supabase의 app_store 표(범위·키별 JSON)에 읽고 쓴다. 범위(scope)는 가족 ID이거나, 모두가 같이 쓰는
 * global이다. 서버만 비밀 키(SUPABASE_SECRET_KEY)로 접근하고, 어느 범위를 쓸지는 서버가 로그인한 사람의
 * 가족을 확인해 정한다. 이 키는 NEXT_PUBLIC_ 이름을 쓰지 않아 브라우저로 나가지 않는다.
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
    async read(scope: string, key: string): Promise<unknown> {
      const { data, error } = await db.from(TABLE).select("value").eq("scope", scope).eq("key", key).limit(1);
      if (error) throw new Error(`저장소 읽기 실패: ${error.message}`);
      return data?.[0]?.value;
    },
    async write(scope: string, key: string, value: unknown): Promise<void> {
      // value 칸은 비울 수 없다. null은 "값 없음"이라 행을 지우고, 다시 읽으면 기본값이 나온다.
      if (value === null || value === undefined) {
        const { error } = await db.from(TABLE).delete().eq("scope", scope).eq("key", key);
        if (error) throw new Error(`저장소 지우기 실패: ${error.message}`);
        return;
      }
      const { error } = await db
        .from(TABLE)
        .upsert({ scope, key, value, updated_at: new Date().toISOString() }, { onConflict: "scope,key" });
      if (error) throw new Error(`저장소 쓰기 실패: ${error.message}`);
    },
  };
}
