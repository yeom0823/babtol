"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { safeNextPath } from "@/lib/safe-next-path";

/** Google로 로그인(Supabase UI Library Social Auth 블록의 LoginForm을 Google과 밥톨 문구로 바꿨다). */
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
    const next = safeNextPath(new URLSearchParams(window.location.search).get("next"), "/kid", window.location.origin);
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
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">밥톨에 로그인</CardTitle>
        <CardDescription>Google 계정으로 로그인하면 가족과 식단을 함께 볼 수 있어요.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {error && (
          <p role="alert" className="m-0 text-sm text-destructive">
            {error}
          </p>
        )}
        <Button className="w-full" size="lg" disabled={loading} onClick={signIn}>
          {loading ? "Google로 이동하는 중" : "Google로 계속하기"}
        </Button>
      </CardContent>
    </Card>
  );
}
