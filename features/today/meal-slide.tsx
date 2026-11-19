import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";

/** 끼니 한 장의 머리: 누가 챙기는지, 끼니 이름, 한 줄 설명. */
export function MealSlide({
  who,
  title,
  sub,
  children,
}: {
  who: "daycare" | "home";
  title: string;
  sub: string;
  children: ReactNode;
}) {
  return (
    <>
      <div className="flex items-center gap-2">
        <Badge variant={who === "home" ? "default" : "secondary"}>
          {who === "home" ? "집에서" : "어린이집에서"}
        </Badge>
        <h2 className="text-[26px] leading-tight font-bold tracking-tight">{title}</h2>
      </div>
      <p className="-mt-1 text-[13px] text-muted-foreground">{sub}</p>
      {children}
    </>
  );
}
