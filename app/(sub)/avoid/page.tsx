import { connection } from "next/server";
import { XIcon } from "lucide-react";

import { BackLink } from "@/components/back-link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { listAvoid } from "@/features/family-settings";

import { addAvoidAction, removeAvoidAction } from "./actions";

export default async function AvoidPage() {
  // 로컬 파일을 요청 때마다 읽으므로 빌드 때 굳지 않게 동적으로 그린다.
  await connection();
  const foods = await listAvoid();
  return (
    <>
      <BackLink href="/kid">우리 아이</BackLink>
      <div className="flex flex-col gap-2">
        <h1 className="text-[22px] font-bold tracking-tight">피할 음식</h1>
        <p className="m-0 text-[13px] text-muted-foreground">
          알레르기가 있거나 아직 먹이지 않는 음식을 적어 두면 추천에서 빼요.
        </p>
      </div>
      <Card>
        <CardContent className="flex flex-col gap-3">
          <form action={addAvoidAction} className="flex gap-2">
            <label htmlFor="avoid-input" className="sr-only">
              피할 음식
            </label>
            <Input id="avoid-input" name="food" placeholder="예: 땅콩, 새우, 메밀" className="h-11" />
            <Button type="submit" className="h-11">
              추가
            </Button>
          </form>
          {foods.length ? (
            <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
              {foods.map((food) => (
                <li key={food}>
                  <Badge variant="outline" className="h-8 gap-1 pr-1 pl-3 text-sm">
                    {food}
                    <form action={removeAvoidAction} className="contents">
                      <input type="hidden" name="food" value={food} />
                      <button
                        type="submit"
                        aria-label={`${food} 빼기`}
                        className="grid size-[22px] place-items-center rounded-full text-muted-foreground hover:bg-accent"
                      >
                        <XIcon className="size-3.5" />
                      </button>
                    </form>
                  </Badge>
                </li>
              ))}
            </ul>
          ) : (
            <Empty className="p-4">
              <EmptyHeader>
                <EmptyMedia variant="icon">🥜</EmptyMedia>
                <EmptyTitle>아직 적어 둔 음식이 없어요</EmptyTitle>
                <EmptyDescription>없으면 비워 둬도 괜찮아요.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </CardContent>
      </Card>
      <p className="px-2 text-center text-xs text-muted-foreground">
        알레르기 진단은 병원에서 받아 주세요. 여기 적은 음식은 추천에서 빼는 데만 써요.
      </p>
    </>
  );
}
