"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { deleteChild, parseAllergies, saveChild } from "@/features/family/server";

const MONTH = /^\d{4}-\d{2}$/;

export async function saveChildAction(id: string | null, _: unknown, form: FormData): Promise<{ failed: boolean }> {
  const birth = String(form.get("birthMonth") ?? "");
  const ok = await saveChild({
    id: id ?? undefined,
    name: String(form.get("name") ?? ""),
    birthMonth: MONTH.test(birth) ? `${birth}-01` : null,
    allergies: parseAllergies(String(form.get("allergies") ?? "")),
  });
  if (!ok) return { failed: true };
  revalidatePath("/kid");
  redirect("/kid");
}

export async function deleteChildAction(id: string): Promise<void> {
  await deleteChild(id);
  revalidatePath("/kid");
  redirect("/kid");
}
