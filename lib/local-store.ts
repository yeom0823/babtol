import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

import { dataDir } from "@/lib/data-dir";

/**
 * 이 컴퓨터의 JSON 파일 하나에 키별로 저장한다(가정 A1).
 * 아이 정보와 계정 세션이 들어가므로 파일은 git이 무시하는 .data/ 아래에 둔다.
 */
function dataFile(): string {
  return (
    process.env.HOME_MEAL_DATA_FILE ?? join(dataDir(), "home-meal.json")
  );
}

async function readAll(): Promise<Record<string, unknown>> {
  try {
    return JSON.parse(await readFile(/*turbopackIgnore: true*/ dataFile(), "utf8"));
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") return {};
    throw e;
  }
}

export async function readStore<T>(key: string, fallback: T): Promise<T> {
  const all = await readAll();
  return key in all ? (all[key] as T) : fallback;
}

// 같은 프로세스 안의 변경은 한 줄로 세워 서로 덮어쓰지 않게 한다.
let queue: Promise<unknown> = Promise.resolve();

export function updateStore<T>(
  key: string,
  fallback: T,
  update: (current: T) => T
): Promise<T> {
  const run = queue.then(async () => {
    const all = await readAll();
    const next = update(key in all ? (all[key] as T) : fallback);
    all[key] = next;
    const file = dataFile();
    await mkdir(dirname(file), { recursive: true });
    const tmp = `${file}.tmp`;
    await writeFile(tmp, JSON.stringify(all, null, 2));
    await rename(tmp, file);
    return next;
  });
  queue = run.catch(() => undefined);
  return run;
}
