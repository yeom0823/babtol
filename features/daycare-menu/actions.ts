"use server";

import { redirect } from "next/navigation";

import { parseDishList } from "./menu-text";
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
