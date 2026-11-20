import { redirect } from "next/navigation";
import { cache } from "react";

import { createAdminClient } from "@/lib/supabase/admin";
import { currentUser } from "@/lib/supabase/server";
import { authEnv } from "@/lib/supabase/env";

export class NoFamilyError extends Error {
  constructor() {
    super("가족을 먼저 만들거나 초대 링크로 들어와 주세요");
  }
}

/** 서버가 확인한 로그인 사용자의 가족 ID. 로그인하지 않았거나 가족이 없으면 null. 요청마다 한 번만 찾는다. */
export const currentFamilyId = cache(async (): Promise<string | null> => {
  const user = await currentUser();
  if (!user) return null;
  const admin = createAdminClient();
  if (!admin) return null;
  const { data } = await admin.from("family_members").select("family_id").eq("user_id", user.id).maybeSingle();
  return data?.family_id ?? null;
});

/**
 * 저장소가 쓸 범위. 로그인 설정이 없는 환경(로컬 파일 모드)에서는 예전처럼 legacy 하나를 쓴다.
 * 로그인 설정이 있으면 반드시 가족이 있어야 하고, 없으면 NoFamilyError를 낸다.
 */
export async function currentFamilyScope(): Promise<string> {
  if (!authEnv()) return "legacy";
  const id = await currentFamilyId();
  if (!id) throw new NoFamilyError();
  return id;
}

/** 가족이 있어야 하는 화면의 layout에서 부른다. 로그인 설정이 있는데 가족이 없으면 가족 만들기로 보낸다. */
export async function requireFamily(): Promise<void> {
  if (!authEnv()) return;
  if (!(await currentFamilyId())) redirect("/family/start");
}
