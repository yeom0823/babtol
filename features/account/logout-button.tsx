"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

/** 로그아웃. 서버가 그린 화면(로그인 상태 표시)도 바로 바뀌도록 새로 그린다. */
export function LogoutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  return (
    <Button
      variant="outline"
      size="sm"
      className="rounded-full px-4"
      disabled={pending}
      onClick={async () => {
        setPending(true);
        await createClient()?.auth.signOut();
        router.replace("/auth/login");
        router.refresh();
      }}
    >
      로그아웃
    </Button>
  );
}
