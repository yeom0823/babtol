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
        className="babtol-splash fixed inset-0 z-[100] grid place-items-center overflow-hidden bg-background transition-opacity duration-400 data-leaving:opacity-0"
      >
        {/* 은은한 배경 동그라미 */}
        <div className="pointer-events-none absolute -top-24 -left-20 size-72 rounded-full bg-primary/8" />
        <div className="pointer-events-none absolute -right-24 -bottom-28 size-80 rounded-full bg-primary/10" />

        <div className="relative flex flex-col items-center">
          <BabtolMascot />
          <div className="mt-5 flex items-baseline gap-0.5 text-[40px] leading-none font-bold tracking-tight text-foreground">
            <span className="babtol-letter" style={{ animationDelay: "520ms" }}>
              밥
            </span>
            <span className="babtol-letter text-primary" style={{ animationDelay: "620ms" }}>
              톨
            </span>
          </div>
          <p className="babtol-tagline mt-3 text-sm text-muted-foreground">
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

/** 밥그릇 위로 튀어 오르는 밥알 한 톨. 김이 모락모락 올라간다. */
function BabtolMascot() {
  return (
    <svg viewBox="0 0 160 160" className="size-52 overflow-visible" role="img" aria-label="밥톨">
      {/* 김 */}
      <g fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="4" className="text-muted-foreground/40">
        <path className="babtol-steam" style={{ animationDelay: "300ms" }} d="M34 70c-6-8 6-12 0-20" />
        <path className="babtol-steam" style={{ animationDelay: "650ms" }} d="M126 70c-6-8 6-12 0-20" />
        <path className="babtol-steam" style={{ animationDelay: "950ms" }} d="M22 84c-5-6 5-9 0-15" />
      </g>

      {/* 그림자 */}
      <ellipse className="babtol-shadow" cx="80" cy="150" rx="46" ry="6" fill="currentColor" opacity="0.08" />

      {/* 밥알(뒤쪽에 깔린 밥) */}
      <g fill="#fffdf6" stroke="#ece3d0" strokeWidth="2">
        <ellipse cx="50" cy="98" rx="14" ry="9" transform="rotate(-18 50 98)" />
        <ellipse cx="110" cy="98" rx="14" ry="9" transform="rotate(18 110 98)" />
        <ellipse cx="80" cy="96" rx="15" ry="9" />
      </g>

      {/* 주인공 밥톨: 그릇에서 폴짝 */}
      <g className="babtol-hop">
        <ellipse cx="80" cy="62" rx="27" ry="34" fill="#fffdf6" stroke="#e8dcc4" strokeWidth="3" />
        {/* 윤기 */}
        <ellipse cx="68" cy="44" rx="6" ry="10" fill="#ffffff" transform="rotate(-20 68 44)" />
        {/* 눈 */}
        <g className="babtol-blink" fill="#3b2a20">
          <ellipse cx="70" cy="64" rx="3.4" ry="4.4" />
          <ellipse cx="90" cy="64" rx="3.4" ry="4.4" />
        </g>
        {/* 볼터치 */}
        <ellipse cx="62" cy="73" rx="6" ry="3.6" fill="#ffb3a7" opacity="0.8" />
        <ellipse cx="98" cy="73" rx="6" ry="3.6" fill="#ffb3a7" opacity="0.8" />
        {/* 웃는 입 */}
        <path d="M74 74q6 6 12 0" fill="none" stroke="#3b2a20" strokeWidth="2.6" strokeLinecap="round" />
      </g>

      {/* 밥그릇 */}
      <path d="M22 100h116c0 26-24 46-58 46s-58-20-58-46z" fill="var(--primary)" />
      <rect x="18" y="94" width="124" height="12" rx="6" fill="var(--primary)" />
      <rect x="18" y="94" width="124" height="5" rx="2.5" fill="#ffffff" opacity="0.22" />
      <path d="M62 146h36v6a4 4 0 0 1-4 4H66a4 4 0 0 1-4-4z" fill="var(--primary)" opacity="0.85" />
      {/* 그릇 무늬 */}
      <g fill="#ffffff" opacity="0.3">
        <circle cx="50" cy="122" r="3" />
        <circle cx="80" cy="128" r="3" />
        <circle cx="110" cy="122" r="3" />
      </g>
    </svg>
  );
}
