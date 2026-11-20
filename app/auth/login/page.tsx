import { BrandHero } from "@/components/brand-hero";
import { LoginForm } from "@/features/account";

const POINTS = [
  ["🏫", "어린이집 식단을 보고 겹치지 않게"],
  ["🍚", "집에서 먹일 아침·간식·저녁 추천"],
  ["👨‍👩‍👧", "가족이 함께 보고 반응을 남겨요"],
] as const;

export default function LoginPage() {
  return (
    <div className="flex flex-1 flex-col justify-center gap-7 py-8">
      <BrandHero
        title={
          <>
            밥<span className="text-primary">톨</span>
          </>
        }
        description="어린이집 식단에 맞춘 우리 아이 집밥"
      />
      <ul className="m-0 flex list-none flex-col gap-2 rounded-3xl bg-primary/8 p-4">
        {POINTS.map(([icon, text]) => (
          <li key={text} className="flex items-center gap-2.5 text-sm">
            <span aria-hidden="true" className="grid size-8 flex-none place-items-center rounded-full bg-background">
              {icon}
            </span>
            {text}
          </li>
        ))}
      </ul>
      <div className="flex flex-col gap-2">
        <LoginForm />
        <p className="m-0 text-center text-xs text-muted-foreground">로그인하면 가족 단위로 식단과 기록이 저장돼요.</p>
      </div>
    </div>
  );
}
