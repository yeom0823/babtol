"use client";

import { useEffect } from "react";

const KEY = "babtol_splash_seen";
const ID = "babtol-splash";

/**
 * 앱 시작 화면: 밥그릇에서 밥알 한 톨(밥톨)이 폴짝 튀어 오르고 이름이 나타난 뒤 사라진다.
 * 브라우저 탭(앱 실행) 하나에 한 번만 보인다. 이미 본 경우에는 바로 뒤의 인라인 스크립트가
 * 첫 화면이 그려지기 전에 숨겨서, 새로고침할 때 번쩍이지 않는다.
 * 움직임 줄이기 설정을 켠 기기에서는 애니메이션 없이 보여 준다(globals.css).
 */
export function SplashScreen() {
  useEffect(() => {
    const el = document.getElementById(ID);
    if (!el || el.hidden) return;
    const leave = setTimeout(() => el.setAttribute("data-leaving", ""), 1500);
    const done = setTimeout(() => {
      el.hidden = true;
      try {
        sessionStorage.setItem(KEY, "1");
      } catch {
        // 저장소를 쓸 수 없으면 다음에도 시작 화면이 한 번 더 보일 뿐이다.
      }
    }, 1900);
    return () => {
      clearTimeout(leave);
      clearTimeout(done);
    };
  }, []);

  return (
    <>
      <div
        id={ID}
        aria-hidden="true"
        suppressHydrationWarning
        className="babtol-splash fixed inset-0 z-[100] flex min-h-dvh items-center justify-center overflow-hidden bg-background px-6 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] transition-opacity duration-400 data-leaving:opacity-0"
      >
        {/* 가운데서 은은하게 퍼지는 빛. 가장자리는 앱과 같은 흰색이라 어떤 화면 비율에서도 잘린 띠가 생기지 않는다. */}
        <div
          className="pointer-events-none absolute top-1/2 left-1/2 size-[min(120vmin,720px)] -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            background:
              "radial-gradient(closest-side, color-mix(in oklch, var(--primary) 13%, var(--background)), color-mix(in oklch, var(--primary) 5%, var(--background)) 55%, var(--background))",
          }}
        />

        {/* 크기는 화면 짧은 변(vmin) 기준이라 휴대폰·태블릿·데스크톱에서 같은 비율로 보인다. */}
        <div className="relative flex flex-col items-center text-[clamp(14px,3.6vmin,22px)]">
          <BabtolMascot />
          <div className="mt-[0.4em] flex items-baseline gap-0.5 font-[family-name:var(--font-cute)] text-[2.6em] leading-none text-foreground">
            <span className="babtol-letter" style={{ animationDelay: "520ms" }}>
              밥
            </span>
            <span className="babtol-letter text-primary" style={{ animationDelay: "620ms" }}>
              톨
            </span>
          </div>
          <p className="babtol-tagline mt-[0.7em] font-[family-name:var(--font-cute)] text-[1.05em] text-muted-foreground">
            어린이집 식단에 맞춘 우리 아이 집밥
          </p>
        </div>
      </div>
      <script
        dangerouslySetInnerHTML={{
          __html: `try{if(sessionStorage.getItem("${KEY}"))document.getElementById("${ID}").hidden=true}catch(e){}`,
        }}
      />
    </>
  );
}

/** 둥근 밥그릇 위로 폴짝 튀어 올라 만세 하는 밥알 한 톨. 김이 모락모락, 반짝이가 반짝. */
function BabtolMascot() {
  const rice = "#fffdf6";
  const line = "#e6d9bf";
  const ink = "#4a3427";
  return (
    <svg viewBox="0 0 120 120" className="size-[9.5em] overflow-visible" role="img" aria-label="밥톨">
      {/* 김 */}
      <g fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="3" className="text-muted-foreground/35">
        <path className="babtol-steam" style={{ animationDelay: "300ms" }} d="M20 58c-4-6 4-9 0-15" />
        <path className="babtol-steam" style={{ animationDelay: "700ms" }} d="M100 58c-4-6 4-9 0-15" />
      </g>

      {/* 반짝이 */}
      <g fill="var(--primary)">
        <path className="babtol-twinkle" style={{ animationDelay: "700ms" }} d="M96 18l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" />
        <path className="babtol-twinkle" style={{ animationDelay: "1000ms" }} d="M22 26l1.5 3.5 3.5 1.5-3.5 1.5-1.5 3.5-1.5-3.5-3.5-1.5 3.5-1.5z" />
      </g>

      {/* 그림자 */}
      <ellipse className="babtol-shadow" cx="60" cy="113" rx="34" ry="4.5" fill="currentColor" opacity="0.08" />

      {/* 뒤에 깔린 밥알 */}
      <g fill={rice} stroke={line} strokeWidth="2">
        <ellipse cx="38" cy="70" rx="10" ry="7" transform="rotate(-20 38 70)" />
        <ellipse cx="82" cy="70" rx="10" ry="7" transform="rotate(20 82 70)" />
      </g>

      {/* 주인공 밥톨: 폴짝 뛰어 만세 */}
      <g className="babtol-hop">
        {/* 팔 */}
        <g strokeLinecap="round" fill="none">
          <path className="babtol-wave-l" d="M38 56l-8-9" stroke={line} strokeWidth="9" />
          <path className="babtol-wave-l" d="M38 56l-8-9" stroke={rice} strokeWidth="5.5" />
          <path className="babtol-wave-r" d="M82 56l8-9" stroke={line} strokeWidth="9" />
          <path className="babtol-wave-r" d="M82 56l8-9" stroke={rice} strokeWidth="5.5" />
        </g>
        {/* 몸: 통통한 동그라미 */}
        <ellipse cx="60" cy="48" rx="24" ry="25" fill={rice} stroke={line} strokeWidth="2.5" />
        {/* 윤기 */}
        <ellipse cx="50" cy="35" rx="5" ry="7" fill="#ffffff" transform="rotate(-25 50 35)" />
        {/* 눈 */}
        <g className="babtol-blink">
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
