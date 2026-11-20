import { cn } from "@/lib/utils";

/** 둥근 밥그릇 위로 폴짝 튀어 올라 만세 하는 밥알 한 톨. 김이 모락모락, 반짝이가 반짝. */
export function BabtolMascot({ animated = false, className }: { animated?: boolean; className?: string }) {
  // 시작 화면에서만 움직인다. 다른 화면에서는 같은 그림을 멈춘 채로 쓴다.
  const a = (name: string) => (animated ? name : undefined);
  const rice = "#fffdf6";
  const line = "#e6d9bf";
  const ink = "#4a3427";
  return (
    <svg viewBox="0 0 120 120" className={cn("overflow-visible", className)} role="img" aria-label="밥톨">
      {/* 김 */}
      <g fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="3" className="text-muted-foreground/35">
        <path className={a("babtol-steam")} style={animated ? { animationDelay: "300ms" } : undefined} d="M20 58c-4-6 4-9 0-15" />
        <path className={a("babtol-steam")} style={animated ? { animationDelay: "700ms" } : undefined} d="M100 58c-4-6 4-9 0-15" />
      </g>

      {/* 반짝이 */}
      <g fill="var(--primary)">
        <path className={a("babtol-twinkle")} style={animated ? { animationDelay: "700ms" } : undefined} d="M96 18l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" />
        <path className={a("babtol-twinkle")} style={animated ? { animationDelay: "1000ms" } : undefined} d="M22 26l1.5 3.5 3.5 1.5-3.5 1.5-1.5 3.5-1.5-3.5-3.5-1.5 3.5-1.5z" />
      </g>

      {/* 그림자 */}
      <ellipse className={a("babtol-shadow")} cx="60" cy="113" rx="34" ry="4.5" fill="currentColor" opacity="0.08" />

      {/* 뒤에 깔린 밥알 */}
      <g fill={rice} stroke={line} strokeWidth="2">
        <ellipse cx="38" cy="70" rx="10" ry="7" transform="rotate(-20 38 70)" />
        <ellipse cx="82" cy="70" rx="10" ry="7" transform="rotate(20 82 70)" />
      </g>

      {/* 주인공 밥톨: 폴짝 뛰어 만세 */}
      <g className={a("babtol-hop")}>
        {/* 팔 */}
        <g strokeLinecap="round" fill="none">
          <path className={a("babtol-wave-l")} d="M38 56l-8-9" stroke={line} strokeWidth="9" />
          <path className={a("babtol-wave-l")} d="M38 56l-8-9" stroke={rice} strokeWidth="5.5" />
          <path className={a("babtol-wave-r")} d="M82 56l8-9" stroke={line} strokeWidth="9" />
          <path className={a("babtol-wave-r")} d="M82 56l8-9" stroke={rice} strokeWidth="5.5" />
        </g>
        {/* 몸: 통통한 동그라미 */}
        <ellipse cx="60" cy="48" rx="24" ry="25" fill={rice} stroke={line} strokeWidth="2.5" />
        {/* 윤기 */}
        <ellipse cx="50" cy="35" rx="5" ry="7" fill="#ffffff" transform="rotate(-25 50 35)" />
        {/* 눈 */}
        <g className={a("babtol-blink")}>
          <circle cx="51.5" cy="48" r="3.4" fill={ink} />
          <circle cx="68.5" cy="48" r="3.4" fill={ink} />
          <circle cx="52.6" cy="46.8" r="1.1" fill="#ffffff" />
          <circle cx="69.6" cy="46.8" r="1.1" fill="#ffffff" />
        </g>
        {/* 볼터치 */}
        <circle cx="45" cy="55" r="4.5" fill="#ffb4a8" opacity="0.75" />
        <circle cx="75" cy="55" r="4.5" fill="#ffb4a8" opacity="0.75" />
        {/* 입: 동글한 ω */}
        <path d="M55.5 55q2.25 3 4.5 0q2.25 3 4.5 0" fill="none" stroke={ink} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </g>

      {/* 둥근 밥그릇 */}
      <path d="M14 72h92c0 20-20 34-46 34S14 92 14 72z" fill="var(--primary)" />
      <rect x="11" y="66" width="98" height="11" rx="5.5" fill="var(--primary)" />
      <rect x="15" y="67.5" width="56" height="3.5" rx="1.75" fill="#ffffff" opacity="0.3" />
      <rect x="47" y="104" width="26" height="7" rx="3.5" fill="var(--primary)" opacity="0.85" />
      {/* 그릇 무늬: 작은 하트 */}
      <path d="M60 91c-3-2.6-5-4.4-5-6.3a2.6 2.6 0 0 1 5-1 2.6 2.6 0 0 1 5 1c0 1.9-2 3.7-5 6.3z" fill="#ffffff" opacity="0.55" />
    </svg>
  );
}
