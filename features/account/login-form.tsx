"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { safeNextPath } from "@/lib/safe-next-path";

/** Google 상표 색을 그대로 쓴 G 로고(버튼 안 장식). */
function GoogleMark() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" className="size-5">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}

/** Google로 로그인(Supabase UI Library Social Auth 블록의 LoginForm을 Google과 밥톨 화면에 맞게 바꿨다). */
export function LoginForm() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const signIn = async () => {
    const supabase = createClient();
    if (!supabase) {
      setError("로그인 설정이 아직 없어요.");
      return;
    }
    setLoading(true);
    setError(null);
    const next = safeNextPath(new URLSearchParams(window.location.search).get("next"), "/", window.location.origin);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/oauth?next=${encodeURIComponent(next)}` },
    });
    if (error) {
      setError("로그인하지 못했어요. 다시 눌러 주세요.");
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <Button
        variant="outline"
        size="lg"
        className="h-12 w-full gap-2.5 rounded-full bg-background text-[15px] font-semibold shadow-xs"
        disabled={loading}
        onClick={signIn}
      >
        <GoogleMark />
        {loading ? "Google로 이동하는 중" : "Google로 계속하기"}
      </Button>
      {error && (
        <p role="alert" className="m-0 text-center text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
