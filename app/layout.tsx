import type { Metadata, Viewport } from "next";
import { Geist_Mono, Jua, Noto_Sans_KR } from "next/font/google";
import "./globals.css";
import { SplashScreen } from "@/components/splash-screen";
import { cn } from "@/lib/utils";

// 화면의 모든 글자(제목 포함)는 한글을 지원하는 고딕 계열 Noto Sans KR로 보여 준다.
const notoSansKr = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
});

// 시작 화면의 "밥톨" 글자에만 쓰는 둥글고 귀여운 글꼴. 앱 화면은 Noto Sans KR 그대로다.
const jua = Jua({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-cute",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "밥톨",
  description: "어린이집 식단과 겹치지 않고 하루 식품군을 채우는 집 끼니 추천",
};

// 휴대폰의 상단바·홈 표시줄 영역까지 화면을 채우고(시작 화면이 잘려 보이지 않게),
// 브라우저 테마 색을 앱 배경(흰색)에 맞춘다.
export const viewport: Viewport = {
  viewportFit: "cover",
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ko"
      className={cn("h-full", "antialiased", notoSansKr.variable, jua.variable, geistMono.variable, "font-sans")}
    >
      <body className="flex min-h-full flex-col bg-background pt-[env(safe-area-inset-top)] text-foreground [word-break:keep-all]">
        <SplashScreen />
        <div className="mx-auto flex w-full max-w-[560px] flex-1 flex-col px-4">
          {children}
        </div>
      </body>
    </html>
  );
}
