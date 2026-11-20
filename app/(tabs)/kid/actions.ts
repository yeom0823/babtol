"use server";

import { createInvite } from "@/features/family/server";

export async function createInviteAction(): Promise<string | null> {
  return createInvite();
}
