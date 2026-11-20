"use client";

import { useEffect } from "react";

const KEY = "babtol_splash_seen";
const ID = "babtol-splash";

/**
 * 앱 시작 화면: 처음 열 때 아이콘과 이름을 잠깐 보여 주고 사라진다.
 * 브라우저 탭(앱 실행) 하나에 한 번만 보인다. 이미 본 경우에는 바로 뒤의 인라인 스크립트가
 * 첫 화면이 그려지기 전에 숨겨서, 새로고침할 때 번쩍이지 않는다.
 */
export function SplashScreen() {
  useEffect(() => {
    const el = document.getElementById(ID);
    if (!el || el.hidden) return;
    const leave = setTimeout(() => el.setAttribute("data-leaving", ""), 1100);
    const done = setTimeout(() => {
      el.hidden = true;
      try {
        sessionStorage.setItem(KEY, "1");
      } catch {
        // 저장소를 쓸 수 없으면 다음에도 시작 화면이 한 번 더 보일 뿐이다.
      }
    }, 1500);
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
        className="fixed inset-0 z-[100] grid place-items-center bg-background transition-opacity duration-300 data-leaving:opacity-0"
      >
        <div className="flex flex-col items-center gap-3">
          <div className="grid size-24 place-items-center rounded-[28px] bg-primary text-5xl shadow-lg">
            🍚
          </div>
          <span className="text-2xl font-bold tracking-tight">밥톨</span>
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
