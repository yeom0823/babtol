import type { Metadata } from "next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import { startAction } from "./actions";

export const metadata: Metadata = {
  title: "밥톨 · 어린이집 식단에 맞춘 집 끼니 추천",
  description: "어린이집 식단과 겹치지 않고 하루 다섯 식품군을 채우는 아침·간식·저녁을 레시피와 함께 추천해요.",
};

const FEATURES = [
  {
    icon: "🍱",
    title: "어린이집 식단과 겹치지 않게",
    body: "점심·간식에 나온 주재료는 빼고, 집에서 줄 아침·하원 후 간식·저녁을 골라요.",
  },
  {
    icon: "🌈",
    title: "하루 다섯 식품군을 채워요",
    body: "곡류, 고기·생선·달걀·콩, 채소, 과일, 우유·유제품 가운데 빈 칸을 집 끼니로 메워요.",
  },
  {
    icon: "📖",
    title: "누구나 따라 만드는 레시피",
    body: "재료와 분량, 순서, 두 돌 아이에게 줄 때 주의할 점(싱겁게, 잘게, 질식 위험)까지 알려 줘요.",
  },
  {
    icon: "😋",
    title: "먹은 반응이 다음 추천에",
    body: "잘 먹음·보통·남김을 한 번 누르면 반영돼요. 남긴 메뉴는 2주 쉬고, 잘 먹은 메뉴는 모아 둬요.",
  },
  {
    icon: "🛒",
    title: "장보기 목록까지",
    body: "내일이나 이번 주 추천 재료를 식품군별로 모아, 필요한 것만 골라 보낼 수 있어요.",
  },
];

const STEPS = [
  { title: "어린이집 식단 넣기", body: "키즈노트를 연결하거나 식단표 사진·링크를 올려요. 없어도 시작할 수 있어요." },
  { title: "오늘 끼니 보기", body: "아침, 간식, 저녁이 왜 이 메뉴인지와 레시피와 함께 나와요." },
  { title: "먹인 뒤 한 번 누르기", body: "아이 반응을 남기면 다음 추천이 우리 아이에게 맞춰져요." },
];

function SampleCard() {
  return (
    <Card aria-label="추천 예시" className="shadow-sm">
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Badge className="bg-primary/12 text-primary">집에서</Badge>
          <span className="text-base font-bold">오늘 저녁</span>
          <span className="ml-auto text-xs text-muted-foreground">밥, 국, 반찬 한 상</span>
        </div>
        <div className="flex items-start gap-1.5 rounded-xl bg-primary/8 px-2.5 py-2 text-[13px] text-primary">
          <span aria-hidden>💡</span>
          <span>어린이집 점심에 소고기가 나와서 오늘 저녁은 생선과 두부로 골랐어요.</span>
        </div>
        <ul className="m-0 flex list-none flex-col gap-2 p-0 text-sm">
          {[
            ["잡곡밥", "기본"],
            ["애호박 된장국", "20분 · 채소"],
            ["대구살 달걀전", "15분 · 고기·생선·달걀·콩"],
            ["두부 브로콜리 무침", "10분 · 채소, 고기·생선·달걀·콩"],
          ].map(([name, meta]) => (
            <li key={name} className="flex items-center justify-between gap-3 border-t pt-2 first:border-t-0 first:pt-0">
              <span className="font-semibold">{name}</span>
              <span className="text-xs text-muted-foreground">{meta}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function StartButton({ label }: { label: string }) {
  return (
    <form action={startAction}>
      <Button type="submit" size="lg" className="h-12 w-full text-base">
        {label}
      </Button>
    </form>
  );
}

/** 처음 여는 기기에 보여 주는 서비스 소개. "시작하기"를 누르면 오늘 화면으로 간다. */
export default function WelcomePage() {
  return (
    <main className="flex flex-col gap-12 py-10">
      <section className="flex flex-col gap-5">
        <span className="text-sm font-bold text-primary">🍚 밥톨</span>
        <h1 className="m-0 text-[30px] leading-[1.3] font-bold tracking-tight">
          오늘 뭘 먹이지?
          <br />
          어린이집 식단 보고 골라 드릴게요
        </h1>
        <p className="m-0 text-[15px] leading-relaxed text-muted-foreground">
          두 돌 전후 아이를 키우는 가족을 위한 집 끼니 추천이에요. 어린이집 식단과 겹치지 않으면서 하루 영양을
          고루 채우는 아침·간식·저녁을, 요리 담당이 아니어도 따라 할 수 있는 레시피와 함께 보여 줘요.
        </p>
        <StartButton label="시작하기" />
      </section>

      <SampleCard />

      <section className="flex flex-col gap-4" aria-labelledby="features">
        <h2 id="features" className="m-0 text-xl font-bold">
          밥톨이 해 주는 일
        </h2>
        <ul className="m-0 grid list-none gap-3 p-0">
          {FEATURES.map((f) => (
            <li key={f.title} className="flex gap-3 rounded-2xl bg-muted/60 p-4">
              <span aria-hidden className="text-2xl leading-none">
                {f.icon}
              </span>
              <div className="flex flex-col gap-1">
                <span className="font-bold">{f.title}</span>
                <span className="text-sm leading-relaxed text-muted-foreground">{f.body}</span>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-4" aria-labelledby="how">
        <h2 id="how" className="m-0 text-xl font-bold">
          이렇게 써요
        </h2>
        <ol className="m-0 flex list-none flex-col gap-3 p-0">
          {STEPS.map((s, i) => (
            <li key={s.title} className="flex gap-3">
              <span className="grid size-8 flex-none place-items-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                {i + 1}
              </span>
              <div className="flex flex-col gap-0.5 pt-1">
                <span className="font-bold">{s.title}</span>
                <span className="text-sm leading-relaxed text-muted-foreground">{s.body}</span>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="flex flex-col gap-3">
        <StartButton label="오늘 끼니 보러 가기" />
        <p className="m-0 text-center text-xs leading-relaxed text-muted-foreground">
          이 추천은 의료·영양 상담이 아니에요. 알레르기나 성장이 걱정되면 소아청소년과 선생님과 먼저 상의해 주세요.
        </p>
      </section>
    </main>
  );
}
