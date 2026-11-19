import { cn } from "@/lib/utils";

/**
 * 음식 사진. 식약처 조리식품 레시피 DB에 같은 이름의 요리가 있으면 그 사진을, 없으면 사진 자리를
 * 비운 기본 모양을 보여 준다. 사진 주소는 외부(http)라 next/image를 쓰지 않는다.
 */
export function DishPicture({
  src,
  name,
  className,
}: {
  src: string | null | undefined;
  name?: string;
  className?: string;
}) {
  if (!src) {
    return (
      <div aria-hidden="true" className={cn("grid place-items-center overflow-hidden bg-muted opacity-80", className)}>
        🍽️
      </div>
    );
  }
  return (
    <div className={cn("overflow-hidden bg-muted", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={name ? `${name} 사진` : ""} loading="lazy" className="size-full object-cover" />
    </div>
  );
}
