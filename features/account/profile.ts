import { createClient, currentUser } from "@/lib/supabase/server";

export type Profile = { email: string; displayName: string | null; createdAt: string; updatedAt: string };

/** 로그인한 사람의 프로필. RLS가 자기 행만 보여 주므로 다른 사람 것은 읽히지 않는다. */
export async function getProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  if (!supabase) return null;
  const id = (await currentUser())?.id;
  if (!id) return null;
  const { data } = await supabase
    .from("profiles")
    .select("email, display_name, created_at, updated_at")
    .eq("id", id)
    .maybeSingle();
  return data
    ? { email: data.email, displayName: data.display_name, createdAt: data.created_at, updatedAt: data.updated_at }
    : null;
}

/** 이름만 고친다. 이메일과 시각은 DB가 맡는다. */
export async function updateDisplayName(name: string): Promise<boolean> {
  const supabase = await createClient();
  if (!supabase) return false;
  const id = (await currentUser())?.id;
  if (!id) return false;
  const clean = name.trim().slice(0, 30);
  const { data, error } = await supabase
    .from("profiles")
    .update({ display_name: clean || null })
    .eq("id", id)
    .select("id");
  return !error && (data?.length ?? 0) === 1;
}
