import { addDays } from "@/lib/date";
import { readStore, updateStore } from "@/lib/local-store";

export type FeedbackValue = "잘 먹음" | "보통" | "남김";

/** 남김을 누른 다음 날부터 쉬는 기간(AC8). */
const REST_DAYS = 14;

type Entry = { value: FeedbackValue; meal: string; seq: number };
type Saved = {
  /** 날짜 → 메뉴 이름 → 반응. 먹은 결과는 메뉴 이름에 붙는다(가정 A4). */
  results: Record<string, Record<string, Entry>>;
  /** 메뉴 이름 → 되돌린 시점의 순서 번호. 그 이전의 남김은 더 이상 쉬게 하지 않는다. */
  released: Record<string, number>;
  seq: number;
};
const KEY = "mealFeedback";
const EMPTY: Saved = { results: {}, released: {}, seq: 0 };

const load = () => readStore<Saved>(KEY, EMPTY);

/** value가 null이면 그 반응을 취소한다. */
export async function setFeedback({
  date,
  meal,
  name,
  value,
}: {
  date: string;
  meal: string;
  name: string;
  value: FeedbackValue | null;
}): Promise<void> {
  await updateStore<Saved>(KEY, EMPTY, (s) => {
    const day = { ...(s.results[date] ?? {}) };
    const seq = s.seq + 1;
    if (value) day[name] = { value, meal, seq };
    else delete day[name];
    return { ...s, seq, results: { ...s.results, [date]: day } };
  });
}

export async function getFeedbackFor(date: string): Promise<Record<string, FeedbackValue>> {
  const day = (await load()).results[date] ?? {};
  return Object.fromEntries(Object.entries(day).map(([name, e]) => [name, e.value]));
}

/** 되돌리지 않은 남김 가운데 가장 늦은 날짜. */
function lastLeftover(s: Saved): Record<string, string> {
  const last: Record<string, string> = {};
  for (const [date, day] of Object.entries(s.results)) {
    for (const [name, e] of Object.entries(day)) {
      if (e.value !== "남김" || e.seq <= (s.released[name] ?? 0)) continue;
      if (!last[name] || date > last[name]) last[name] = date;
    }
  }
  return last;
}

/** 그 날짜의 추천에 나오면 안 되는 잠깐 쉬는 메뉴. 그날 이미 보이는 끼니는 바꾸지 않는다. */
export async function restingNamesFor(date: string): Promise<string[]> {
  const last = lastLeftover(await load());
  return Object.keys(last).filter((n) => last[n] < date && date <= addDays(last[n], REST_DAYS));
}

/** 지금 쉬고 있는 메뉴와 언제까지 쉬는지. */
export async function listResting(today: string): Promise<{ name: string; until: string }[]> {
  const last = lastLeftover(await load());
  return Object.keys(last)
    .map((name) => ({ name, until: addDays(last[name], REST_DAYS) }))
    .filter((r) => r.until >= today)
    .sort((a, b) => b.until.localeCompare(a.until));
}

/** 다시 추천받게 되돌린다. 바로 다시 추천 후보가 된다. */
export async function releaseResting(name: string): Promise<void> {
  await updateStore<Saved>(KEY, EMPTY, (s) => ({
    ...s,
    released: { ...s.released, [name]: s.seq },
  }));
}

/** 잘 먹음을 누른 메뉴를 횟수와 함께. 지금 쉬는 메뉴는 뺀다. */
export async function listFavorites(
  today: string
): Promise<{ name: string; count: number; lastDate: string; meal: string }[]> {
  const s = await load();
  const resting = new Set(
    Object.entries(lastLeftover(s))
      .filter(([, d]) => addDays(d, REST_DAYS) >= today)
      .map(([n]) => n)
  );
  const byName = new Map<string, { count: number; lastDate: string; meal: string }>();
  for (const [date, day] of Object.entries(s.results).sort(([a], [b]) => a.localeCompare(b))) {
    for (const [name, e] of Object.entries(day)) {
      if (e.value !== "잘 먹음" || resting.has(name)) continue;
      const prev = byName.get(name);
      byName.set(name, { count: (prev?.count ?? 0) + 1, lastDate: date, meal: e.meal });
    }
  }
  return [...byName.entries()]
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => b.count - a.count || b.lastDate.localeCompare(a.lastDate));
}

/** 추천에서 우선할 잘 먹은 메뉴. 바로 다음 날에는 다시 내지 않는다(가정 A4). */
export async function favoriteNamesFor(date: string): Promise<string[]> {
  const yesterday = addDays(date, -1);
  return (await listFavorites(date)).filter((f) => f.lastDate !== yesterday).map((f) => f.name);
}
