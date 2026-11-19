"use server";

import { revalidatePath } from "next/cache";

import { addAvoid, removeAvoid } from "@/features/family-settings";

export async function addAvoidAction(formData: FormData) {
  await addAvoid(String(formData.get("food") ?? ""));
  revalidatePath("/avoid");
  revalidatePath("/settings");
}

export async function removeAvoidAction(formData: FormData) {
  await removeAvoid(String(formData.get("food") ?? ""));
  revalidatePath("/avoid");
  revalidatePath("/settings");
}
