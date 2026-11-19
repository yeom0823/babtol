import { readStore, updateStore } from "@/lib/local-store";

const KEY = "avoidFoods";

/** 쉼표나 공백으로 나눠 적은 음식을 나눈다. 중복은 하나로 한다. */
export function parseAvoidInput(text: string): string[] {
  return [...new Set(text.split(/[,\s]+/).map((s) => s.trim()).filter(Boolean))];
}

export function listAvoid(): Promise<string[]> {
  return readStore<string[]>(KEY, []);
}

export async function addAvoid(text: string): Promise<void> {
  const added = parseAvoidInput(text);
  await updateStore<string[]>(KEY, [], (list) => [...list, ...added.filter((a) => !list.includes(a))]);
}

export async function removeAvoid(name: string): Promise<void> {
  await updateStore<string[]>(KEY, [], (list) => list.filter((x) => x !== name));
}
