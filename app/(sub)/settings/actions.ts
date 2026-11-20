"use server";

import { revalidatePath } from "next/cache";

import { updateDisplayName } from "@/features/account/server";

export async function saveDisplayNameAction(_: unknown, form: FormData): Promise<{ ok: boolean; message: string }> {
  const ok = await updateDisplayName(String(form.get("displayName") ?? ""));
  if (ok) {
    revalidatePath("/settings");
    revalidatePath("/kid");
  }
  return { ok, message: ok ? "저장했어요" : "저장하지 못했어요. 다시 로그인해 주세요." };
}
