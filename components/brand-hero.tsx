import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import { BabtolMascot } from "./babtol-mascot";

/**
 * 밥톨 마스코트와 귀여운 글꼴(Jua) 제목으로 화면 머리를 만든다. 시작 화면(스플래시)과 같은
 * 은은한 주황 빛을 깔아 로그인, 가족 시작, 초대처럼 처음 만나는 화면의 분위기를 맞춘다.
 */
export function BrandHero({
  title,
  description,
  size = "md",
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  size?: "sm" | "md";
  className?: string;
}) {
  return (
    <div className={cn("relative flex flex-col items-center text-center", className)}>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-0 left-1/2 size-56 -translate-x-1/2 -translate-y-6 rounded-full"
        style={{
          background:
            "radial-gradient(closest-side, color-mix(in oklch, var(--primary) 14%, transparent), transparent)",
        }}
      />
      <BabtolMascot className={cn("relative", size === "md" ? "size-28" : "size-20")} />
      <h1 className="relative mt-2 font-cute text-[26px] leading-tight text-foreground">{title}</h1>
      {description && (
        <p className="relative m-0 mt-1.5 max-w-[30ch] text-[13px] leading-relaxed text-muted-foreground">
          {description}
        </p>
      )}
    </div>
  );
}
