import { Skeleton } from "@/components/ui/skeleton";

/**
 * 탭을 누르면 서버가 화면을 그리는 동안 바로 보여 주는 뼈대. Next.js가 이 화면을 미리 받아 두어
 * 탭을 누르는 즉시 바뀐 것처럼 보이고, 실제 내용은 준비되는 대로 채워진다.
 */
export default function Loading() {
  return (
    <div aria-busy="true" aria-label="불러오는 중" className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-7 w-2/3 rounded-lg" />
        <Skeleton className="h-4 w-1/2 rounded-md" />
      </div>
      <Skeleton className="h-11 w-full rounded-full" />
      <Skeleton className="h-48 w-full rounded-3xl" />
      <Skeleton className="h-20 w-full rounded-3xl" />
      <Skeleton className="h-20 w-full rounded-3xl" />
    </div>
  );
}
