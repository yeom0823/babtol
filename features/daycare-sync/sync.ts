import { getMenus, saveMenus } from "@/features/daycare-menu";
import { KidsnoteAuthError, fetchMenus, getSession, markExpired } from "@/features/kidsnote";
import { addDays, weekOf } from "@/lib/date";
import { readStore, updateStore } from "@/lib/local-store";

export type SyncResult = "none" | "synced" | "expired" | "recent" | "error";

const LAST_SYNC = "kidsnoteLastSync";
const RECENT_MS = 60 * 60 * 1000;

/**
 * 연결된 키즈노트에서 이번 주와 다음 주 식단을 가져와 저장한다.
 * 사용자가 올려서 고친 식단은 덮어쓰지 않고, 세션이 만료되면 만료로 표시한다.
 */
export async function syncDaycareMenus(
  today: string,
  f: typeof fetch = fetch,
  { force = false }: { force?: boolean } = {}
): Promise<SyncResult> {
  const session = await getSession();
  if (!session) return "none";

  if (!force) {
    const last = await readStore<number>(LAST_SYNC, 0);
    if (Date.now() - last < RECENT_MS) return "recent";
  }

  const start = weekOf(today)[0];
  const end = addDays(start, 13);
  try {
    const fetched = await fetchMenus(session.cookie, session.centerId, start, end, f);
    const mine = await getMenus(Object.keys(fetched));
    const toSave = Object.fromEntries(
      Object.entries(fetched).filter(([iso]) => mine[iso]?.source !== "upload")
    );
    await saveMenus(toSave, "kidsnote");
    await updateStore<number>(LAST_SYNC, 0, () => Date.now());
    return "synced";
  } catch (e) {
    if (e instanceof KidsnoteAuthError) {
      await markExpired();
      return "expired";
    }
    return "error";
  }
}
