import type { FoodGroup } from "@/features/meal-plan";
import { cn } from "@/lib/utils";

/** 식품군마다 색을 정해 메뉴 목록과 하루 식품군 요약에서 같은 색으로 보여 준다. */
const TONE: Record<FoodGroup, string> = {
  곡류: "bg-amber-100 text-amber-800",
  "고기·생선·달걀·콩": "bg-rose-100 text-rose-800",
  채소: "bg-green-100 text-green-800",
  과일: "bg-orange-100 text-orange-800",
  "우유·유제품": "bg-sky-100 text-sky-800",
};

const SHORT: Record<FoodGroup, string> = {
  곡류: "곡류",
  "고기·생선·달걀·콩": "단백질",
  채소: "채소",
  과일: "과일",
  "우유·유제품": "유제품",
};

export function FoodGroupChip({ group, muted, className }: { group: FoodGroup; muted?: boolean; className?: string }) {
  return (
    <span
      title={group}
      className={cn(
        "inline-flex h-5 items-center rounded-full px-1.5 text-[11px] font-semibold",
        muted ? "border border-dashed border-destructive/60 bg-transparent text-destructive" : TONE[group],
        className
      )}
    >
      {SHORT[group]}
    </span>
  );
}
