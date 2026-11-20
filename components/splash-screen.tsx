"use client";

import { useEffect } from "react";

import { BabtolMascot } from "./babtol-mascot";

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
          <BabtolMascot animated className="size-[9.5em]" />
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
