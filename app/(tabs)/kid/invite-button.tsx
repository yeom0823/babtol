"use client";

import { LinkIcon } from "lucide-react";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";

/** 초대 링크를 만들어 공유 창(휴대폰) 또는 클립보드로 보낸다. 링크는 7일 동안 쓸 수 있다. */
export function InviteButton({ create }: { create: () => Promise<string | null> }) {
  const [pending, startTransition] = useTransition();
  const [note, setNote] = useState<string | null>(null);

  const share = () =>
    startTransition(async () => {
      setNote(null);
      const code = await create();
      if (!code) {
        setNote("링크를 만들지 못했어요. 다시 눌러 주세요.");
        return;
      }
      const url = `${window.location.origin}/join/${code}`;
      const text = "밥톨에서 우리 아이 식단을 같이 봐요";
      try {
        if (navigator.share) {
          await navigator.share({ title: "밥톨 가족 초대", text, url });
          setNote("초대 링크를 보냈어요. 7일 동안 쓸 수 있어요.");
        } else {
          await navigator.clipboard.writeText(url);
          setNote("초대 링크를 복사했어요. 카톡에 붙여 넣어 보내세요. 7일 동안 쓸 수 있어요.");
        }
      } catch {
        setNote(`이 링크를 가족에게 보내 주세요: ${url}`);
      }
    });

  return (
    <div className="flex flex-col gap-1.5">
      <Button variant="outline" size="sm" className="self-start" disabled={pending} onClick={share}>
        <LinkIcon data-icon="inline-start" />
        {pending ? "만드는 중" : "가족 초대 링크 보내기"}
      </Button>
      {note && (
        <p role="status" className="m-0 text-xs break-all text-muted-foreground">
          {note}
        </p>
      )}
    </div>
  );
}
