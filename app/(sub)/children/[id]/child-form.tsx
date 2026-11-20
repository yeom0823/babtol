"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ChildForm({
  initial,
  save,
}: {
  initial: { name: string; birthMonth: string; allergies: string };
  save: (prev: unknown, form: FormData) => Promise<{ failed: boolean }>;
}) {
  const [state, action, pending] = useActionState(save, null);
  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="child-name" className="text-sm font-semibold">
          이름(별명)
        </label>
        <Input id="child-name" name="name" required maxLength={20} defaultValue={initial.name} placeholder="지우" />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="child-birth" className="text-sm font-semibold">
          태어난 해와 달
        </label>
        <Input id="child-birth" name="birthMonth" type="month" defaultValue={initial.birthMonth} />
        <span className="text-xs text-muted-foreground">개월 수에 맞춰 메뉴와 주의 사항을 골라요.</span>
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="child-allergies" className="text-sm font-semibold">
          알레르기·피할 음식
        </label>
        <Input
          id="child-allergies"
          name="allergies"
          defaultValue={initial.allergies}
          placeholder="땅콩, 새우, 메밀"
        />
        <span className="text-xs text-muted-foreground">쉼표로 나눠 적어 주세요. 이 아이 추천에서 뺄게요.</span>
      </div>
      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "저장하는 중" : "저장"}
      </Button>
      {state?.failed && (
        <p role="alert" className="m-0 text-xs text-destructive">
          저장하지 못했어요. 이름을 적었는지 확인해 주세요.
        </p>
      )}
    </form>
  );
}
