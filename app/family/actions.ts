"use server";

import { redirect } from "next/navigation";

import { createFamily, joinFamily } from "@/features/family/server";

export async function createFamilyAction(_: unknown, form: FormData): Promise<{ failed: boolean }> {
  const result = await createFamily(String(form.get("name") ?? ""));
  if (!result.ok) return { failed: true };
  redirect("/kid");
}

export async function joinFamilyAction(code: string): Promise<{ failed: boolean; already?: boolean }> {
  const result = await joinFamily(code);
  if (result === "joined") redirect("/");
  return { failed: true, already: result === "already" };
}
