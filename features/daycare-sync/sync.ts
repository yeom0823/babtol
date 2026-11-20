import { getMenus, saveMenus } from "@/features/daycare-menu/server";
import { KidsnoteAuthError, fetchMenus, getSession, markExpired } from "@/features/kidsnote";
import { addDays, weekOf } from "@/lib/date";
import { readStore, updateStore } from "@/lib/local-store";

export type SyncResult = "none" | "synced" | "expired" | "recent" | "error";

const LAST_SYNC = "kidsnoteLastSync";
/**
 * 키즈노트는 공개 API가 아니어서 요청이 잦으면 계정이 막힐 수 있다. 화면을 열 때는 1시간에 한 번만,
 * "새로 가져오기" 버튼도 마지막으로 가져온 지 5분이 지나야 부른다. 버튼을 여러 번 눌러도 이 간격을 지킨다.
 */
const RECENT_MS = 60 * 60 * 1000;
const FORCE_GAP_MS = 5 * 60 * 1000;

/**
 * 연결된 키즈노트에서 이번 주와 다음 주 식단을 가져와 저장한다.
 * 사용자가 올려서 고친 식단은 덮어쓰지 않고, 세션이 만료되면 만료로 표시한다.
 */
export async function syncDaycareMenus(
  today: string,
  f: typeof fetch = fetch,
  { force = false }: { force?: boolean } = {}
): Promise<SyncResult> {
  const [session, last] = await Promise.all([getSession(), readStore<number>(LAST_SYNC, 0)]);
  if (!session) return "none";

  if (Date.now() - last < (force ? FORCE_GAP_MS : RECENT_MS)) return "recent";

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

/** 키즈노트에서 마지막으로 가져온 시각(ms). 한 번도 없으면 null. */
export async function lastSyncedAt(): Promise<number | null> {
  const last = await readStore<number>(LAST_SYNC, 0);
  return last || null;
}
