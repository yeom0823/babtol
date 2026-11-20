"use client";

import { useActionState, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const field = "h-11 rounded-full bg-background px-4 text-base";

export function ChildForm({
  initial,
  save,
}: {
  initial: { name: string; birthMonth: string; allergies: string };
  save: (prev: unknown, form: FormData) => Promise<{ failed: boolean }>;
}) {
  const [state, action, pending] = useActionState(save, null);
  const [allergies, setAllergies] = useState(initial.allergies);
  const chips = [...new Set(allergies.split(/[,\s]+/).map((s) => s.trim()).filter(Boolean))];

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="child-name" className="px-1 text-sm font-semibold">
          이름(별명)
        </label>
        <Input id="child-name" name="name" required maxLength={20} defaultValue={initial.name} placeholder="도하" className={field} />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="child-birth" className="px-1 text-sm font-semibold">
          태어난 해와 달
        </label>
        <Input id="child-birth" name="birthMonth" type="month" defaultValue={initial.birthMonth} className={field} />
        <span className="px-1 text-xs text-muted-foreground">개월 수에 맞춰 메뉴와 주의 사항을 골라요.</span>
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="child-allergies" className="px-1 text-sm font-semibold">
          알레르기·피할 음식
        </label>
        <Input
          id="child-allergies"
          name="allergies"
          value={allergies}
          onChange={(e) => setAllergies(e.target.value)}
          placeholder="땅콩, 새우, 메밀"
          className={field}
        />
        {chips.length > 0 ? (
          <div className="flex flex-wrap gap-1 px-1">
            {chips.map((c) => (
              <span key={c} className="rounded-full bg-background px-2 py-0.5 text-xs text-muted-foreground">
                🚫 {c}
              </span>
            ))}
          </div>
        ) : (
          <span className="px-1 text-xs text-muted-foreground">쉼표로 나눠 적으면 이 아이 추천에서 빼요.</span>
        )}
      </div>
      <Button type="submit" size="lg" className="mt-1 h-11 rounded-full text-[15px]" disabled={pending}>
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
