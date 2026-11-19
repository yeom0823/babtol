import { readStore, updateStore } from "@/lib/local-store";

import type { DayMenu } from "./menu-text";

export type StoredMenu = DayMenu & { source: "kidsnote" | "upload" };

const KEY = "daycareMenus";
type Menus = Record<string, StoredMenu>;

export async function saveMenus(
  menus: Record<string, DayMenu>,
  source: StoredMenu["source"]
): Promise<void> {
  await updateStore<Menus>(KEY, {}, (current) => {
    const next = { ...current };
    for (const [iso, menu] of Object.entries(menus)) next[iso] = { ...menu, source };
    return next;
  });
}

export async function getMenu(iso: string): Promise<StoredMenu | null> {
  return (await readStore<Menus>(KEY, {}))[iso] ?? null;
}

export async function getMenus(isos: string[]): Promise<Record<string, StoredMenu>> {
  const all = await readStore<Menus>(KEY, {});
  return Object.fromEntries(isos.filter((i) => all[i]).map((i) => [i, all[i]]));
}
