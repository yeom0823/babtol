import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/** 추천을 만드는 동안 집 끼니 자리를 채우는 뼈대. */
export function PlanSkeleton() {
  return (
    <Card aria-busy="true">
      <CardContent className="flex flex-col gap-3">
        <Skeleton className="h-10 w-full rounded-xl" />
        <div className="flex items-center gap-3">
          <Skeleton className="size-[60px] rounded-2xl" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-4 w-3/5" />
            <Skeleton className="h-3 w-2/5" />
          </div>
        </div>
        <Skeleton className="h-9 w-full rounded-full" />
      </CardContent>
    </Card>
  );
}
