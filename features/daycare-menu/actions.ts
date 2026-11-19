"use server";

import { redirect } from "next/navigation";

import { parseDayMenu, parseDishList, type DayMenu } from "./menu-text";
import { saveMenus } from "./repository";

export type ManualMenuState = { error: string } | null;

/** 읽지 못했을 때 사용자가 한 날짜의 점심 메뉴를 직접 적어 저장한다. */
export async function saveManualMenu(
  _prev: ManualMenuState,
  formData: FormData
): Promise<ManualMenuState> {
  const date = String(formData.get("date") ?? "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { error: "날짜를 확인할 수 없어요." };
  const lunch = parseDishList(String(formData.get("lunch") ?? ""));
  if (!lunch.length) return { error: "메뉴를 한 가지 이상 적어 주세요." };
  await saveMenus({ [date]: { lunch, morningSnack: [], afternoonSnack: [] } }, "upload");
  redirect(`/?d=${date}`);
}

export type ReadMenusState = { error: string } | null;

/**
 * 사진이나 링크에서 읽은 뒤 사용자가 확인하고 고친 날짜별 식단을 저장한다(AC4).
 * 저장하면 그 날짜들의 점심 장에 "올린 식단표에서 읽었어요"로 나온다.
 */
export async function saveReadMenus(
  _prev: ReadMenusState,
  formData: FormData
): Promise<ReadMenusState> {
  let entries: { date: string; text: string }[];
  try {
    entries = JSON.parse(String(formData.get("entries") ?? "[]"));
  } catch {
    return { error: "읽은 식단을 확인할 수 없어요." };
  }
  const menus: Record<string, DayMenu> = {};
  for (const { date, text } of entries) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { error: "날짜를 다시 확인해 주세요." };
    const menu = parseDayMenu(text);
    if (!menu) return { error: `${date} 점심 메뉴를 한 가지 이상 적어 주세요.` };
    menus[date] = menu;
  }
  const dates = Object.keys(menus).sort();
  if (!dates.length) return { error: "저장할 식단이 없어요." };
  await saveMenus(menus, "upload");
  redirect(`/?d=${dates[0]}`);
}
