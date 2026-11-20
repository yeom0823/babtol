import { randomBytes } from "node:crypto";

import { currentFamilyId } from "@/lib/current-family";
import { createAdminClient } from "@/lib/supabase/admin";
import { currentUser } from "@/lib/supabase/server";

/**
 * 가족·초대·아이. 표는 RLS로 막혀 있어 서버의 비밀 키 클라이언트로만 다룬다.
 * 그래서 모든 함수는 먼저 서버가 확인한 로그인 사용자와 그 사람의 가족을 찾고, 그 가족의 행만 다룬다.
 */

export type Member = { userId: string; name: string; email: string; role: "owner" | "member"; isMe: boolean };
export type Family = { id: string; name: string; members: Member[] };
export type Child = { id: string; name: string; birthMonth: string | null; allergies: string[] };

const INVITE_DAYS = 7;

function db() {
  const admin = createAdminClient();
  if (!admin) throw new Error("저장소 설정이 없어요");
  return admin;
}

/** 내 가족과 구성원. 가족이 없으면 null. */
export async function myFamily(): Promise<Family | null> {
  const user = await currentUser();
  const familyId = await currentFamilyId();
  if (!user || !familyId) return null;
  const admin = db();
  const [{ data: family }, { data: members }] = await Promise.all([
    admin.from("families").select("id, name").eq("id", familyId).single(),
    admin.from("family_members").select("user_id, role, joined_at").eq("family_id", familyId).order("joined_at"),
  ]);
  if (!family) return null;
  const ids = (members ?? []).map((m) => m.user_id);
  const { data: profiles } = await admin.from("profiles").select("id, email, display_name").in("id", ids);
  const byId = new Map((profiles ?? []).map((p) => [p.id, p]));
  return {
    id: family.id,
    name: family.name,
    members: (members ?? []).map((m) => {
      const p = byId.get(m.user_id);
      return {
        userId: m.user_id,
        name: p?.display_name || p?.email?.split("@")[0] || "가족",
        email: p?.email ?? "",
        role: m.role as Member["role"],
        isMe: m.user_id === user.id,
      };
    }),
  };
}

/**
 * 가족 만들기. 로그인했고 아직 가족이 없을 때만 된다. 처음 생기는 가족이면 로그인 기능 전의
 * 데이터(legacy 범위: 식단, 추천, 먹은 반응, 키즈노트 연결)를 이 가족 것으로 옮긴다.
 */
export async function createFamily(name: string): Promise<{ ok: boolean; claimedLegacy?: boolean }> {
  const user = await currentUser();
  if (!user || (await currentFamilyId())) return { ok: false };
  const admin = db();
  const { data: family, error } = await admin
    .from("families")
    .insert({ name: name.trim().slice(0, 20) || "우리 집" })
    .select("id")
    .single();
  if (error || !family) return { ok: false };
  const { error: memberError } = await admin
    .from("family_members")
    .insert({ family_id: family.id, user_id: user.id, role: "owner" });
  if (memberError) {
    await admin.from("families").delete().eq("id", family.id);
    return { ok: false };
  }
  const { count } = await admin.from("families").select("id", { count: "exact", head: true });
  let claimedLegacy = false;
  if (count === 1) {
    const { error: moveError } = await admin.from("app_store").update({ scope: family.id }).eq("scope", "legacy");
    claimedLegacy = !moveError;
  }
  return { ok: true, claimedLegacy };
}

/** 초대 링크 코드 만들기. 7일 동안 여러 사람이 쓸 수 있다. */
export async function createInvite(): Promise<string | null> {
  const user = await currentUser();
  const familyId = await currentFamilyId();
  if (!user || !familyId) return null;
  const code = randomBytes(9).toString("base64url");
  const expires = new Date(Date.now() + INVITE_DAYS * 864e5).toISOString();
  const { error } = await db()
    .from("family_invites")
    .insert({ code, family_id: familyId, created_by: user.id, expires_at: expires });
  return error ? null : code;
}

export type InviteInfo = { familyName: string; expired: boolean } | null;

/** 초대 코드가 가리키는 가족 이름. 없는 코드면 null. 로그인 전에도 이름은 보여 준다. */
export async function inviteInfo(code: string): Promise<InviteInfo> {
  if (!/^[\w-]{6,40}$/.test(code)) return null;
  const { data } = await db()
    .from("family_invites")
    .select("expires_at, families(name)")
    .eq("code", code)
    .maybeSingle();
  if (!data) return null;
  const family = data.families as unknown as { name: string } | null;
  return { familyName: family?.name ?? "가족", expired: new Date(data.expires_at).getTime() < Date.now() };
}

export type JoinResult = "joined" | "already" | "invalid" | "signed-out";

/** 초대 코드로 가족에 들어가기. 이미 다른 가족이 있으면 들어가지 않는다. */
export async function joinFamily(code: string): Promise<JoinResult> {
  const user = await currentUser();
  if (!user) return "signed-out";
  if (await currentFamilyId()) return "already";
  const admin = db();
  const { data: invite } = await admin.from("family_invites").select("family_id, expires_at").eq("code", code).maybeSingle();
  if (!invite || new Date(invite.expires_at).getTime() < Date.now()) return "invalid";
  const { error } = await admin
    .from("family_members")
    .insert({ family_id: invite.family_id, user_id: user.id, role: "member" });
  return error ? "invalid" : "joined";
}

/** 가족 이름 바꾸기. */
export async function renameFamily(name: string): Promise<boolean> {
  const familyId = await currentFamilyId();
  const clean = name.trim().slice(0, 20);
  if (!familyId || !clean) return false;
  const { error } = await db().from("families").update({ name: clean }).eq("id", familyId);
  return !error;
}

/** 우리 가족 아이들. 먼저 등록한 순서. */
export async function listChildren(): Promise<Child[]> {
  const familyId = await currentFamilyId();
  if (!familyId) return [];
  const { data } = await db()
    .from("children")
    .select("id, name, birth_month, allergies")
    .eq("family_id", familyId)
    .order("created_at");
  return (data ?? []).map((c) => ({ id: c.id, name: c.name, birthMonth: c.birth_month, allergies: c.allergies ?? [] }));
}

export async function getChild(id: string): Promise<Child | null> {
  return (await listChildren()).find((c) => c.id === id) ?? null;
}

/** 아이 추가·고치기. id가 있으면 우리 가족의 그 아이만 고친다. */
export async function saveChild(input: {
  id?: string;
  name: string;
  birthMonth: string | null;
  allergies: string[];
}): Promise<boolean> {
  const familyId = await currentFamilyId();
  const name = input.name.trim().slice(0, 20);
  if (!familyId || !name) return false;
  const row = {
    name,
    birth_month: input.birthMonth,
    allergies: input.allergies.slice(0, 30),
    updated_at: new Date().toISOString(),
  };
  const admin = db();
  const { error } = input.id
    ? await admin.from("children").update(row).eq("id", input.id).eq("family_id", familyId)
    : await admin.from("children").insert({ ...row, family_id: familyId });
  return !error;
}

export async function deleteChild(id: string): Promise<boolean> {
  const familyId = await currentFamilyId();
  if (!familyId) return false;
  const { error } = await db().from("children").delete().eq("id", id).eq("family_id", familyId);
  return !error;
}
