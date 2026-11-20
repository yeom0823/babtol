import { AsyncLocalStorage } from "node:async_hooks";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

import { currentFamilyScope } from "@/lib/current-family";
import { dataDir } from "@/lib/data-dir";
import { createSupabaseStore } from "@/lib/supabase-store";

/**
 * 범위(scope)·키별로 값을 저장한다. Supabase 접속 정보(SUPABASE_URL, SUPABASE_SECRET_KEY)가 있으면
 * Supabase의 app_store 표에, 없으면 이 컴퓨터의 JSON 파일 하나에 저장한다(가정 A1).
 *
 * 범위는 가족이다. 요청을 보낸 사람이 속한 가족을 서버가 확인해서 그 가족의 값만 읽고 쓴다.
 * 메뉴 사진 캐시처럼 가족과 상관없는 값(GLOBAL_KEYS)은 global 범위에 두고 함께 쓴다.
 * 파일에는 아이 정보와 계정 세션이 들어가므로 git이 무시하는 .data/ 아래에 둔다.
 */
type Backend = {
  read(scope: string, key: string): Promise<unknown>;
  write(scope: string, key: string, value: unknown): Promise<void>;
};

/** 로그인 기능이 생기기 전의 데이터. 첫 가족이 생기면 그 가족 것으로 옮긴다. */
export const LEGACY_SCOPE = "legacy";
const GLOBAL_SCOPE = "global";
const isGlobalKey = (key: string) => key.startsWith("dishPhotos");

function dataFile(): string {
  return process.env.HOME_MEAL_DATA_FILE ?? join(dataDir(), "home-meal.json");
}

async function readAll(): Promise<Record<string, unknown>> {
  try {
    return JSON.parse(await readFile(/*turbopackIgnore: true*/ dataFile(), "utf8"));
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") return {};
    throw e;
  }
}

// 파일에서는 legacy 범위를 예전처럼 키 그대로 두고, 다른 범위는 "범위:키"로 둔다.
const fileKey = (scope: string, key: string) => (scope === LEGACY_SCOPE ? key : `${scope}:${key}`);

const fileBackend: Backend = {
  async read(scope, key) {
    return (await readAll())[fileKey(scope, key)];
  },
  async write(scope, key, value) {
    const all = await readAll();
    all[fileKey(scope, key)] = value;
    const file = dataFile();
    await mkdir(dirname(file), { recursive: true });
    const tmp = `${file}.tmp`;
    await writeFile(tmp, JSON.stringify(all, null, 2));
    await rename(tmp, file);
  },
};

function backend(): Backend {
  // 테스트처럼 파일 위치를 직접 정하면 파일을 쓴다.
  if (process.env.HOME_MEAL_DATA_FILE) return fileBackend;
  const url = process.env.SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  return url && secretKey ? createSupabaseStore({ url, secretKey }) : fileBackend;
}

const scoped = new AsyncLocalStorage<string>();

/** 정해진 범위로 fn을 실행한다. 테스트, 그리고 가족을 막 만든 직후처럼 범위를 직접 정할 때 쓴다. */
export function runWithScope<T>(scope: string, fn: () => Promise<T>): Promise<T> {
  return scoped.run(scope, fn);
}

async function scopeFor(key: string): Promise<string> {
  if (isGlobalKey(key)) return GLOBAL_SCOPE;
  const fixed = scoped.getStore();
  if (fixed) return fixed;
  // 테스트에서 파일 위치를 정했으면 예전처럼 하나의 범위만 쓴다.
  if (process.env.HOME_MEAL_DATA_FILE) return LEGACY_SCOPE;
  return currentFamilyScope();
}

export async function readStore<T>(key: string, fallback: T): Promise<T> {
  const value = await backend().read(await scopeFor(key), key);
  return value === undefined ? fallback : (value as T);
}

// 같은 서버 안의 변경은 한 줄로 세워 서로 덮어쓰지 않게 한다.
// 서버가 여러 대일 때 같은 키를 동시에 바꾸면 나중 것이 남는다(사용자가 적어 드물다).
let queue: Promise<unknown> = Promise.resolve();

export async function updateStore<T>(key: string, fallback: T, update: (current: T) => T): Promise<T> {
  // 범위는 줄에 서기 전에, 요청 맥락 안에서 정한다.
  const scope = await scopeFor(key);
  const run = queue.then(async () => {
    const store = backend();
    const current = await store.read(scope, key);
    const next = update(current === undefined ? fallback : (current as T));
    await store.write(scope, key, next);
    return next;
  });
  queue = run.catch(() => undefined);
  return run;
}
