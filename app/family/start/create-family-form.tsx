"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function CreateFamilyForm({
  create,
}: {
  create: (prev: unknown, form: FormData) => Promise<{ failed: boolean }>;
}) {
  const [state, action, pending] = useActionState(create, null);
  return (
    <form action={action} className="flex flex-col gap-2">
      <label htmlFor="family-name" className="text-sm font-semibold">
        가족 이름
      </label>
      <Input id="family-name" name="name" defaultValue="우리 집" maxLength={20} />
      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "만드는 중" : "가족 만들기"}
      </Button>
      {state?.failed && (
        <p role="alert" className="m-0 text-xs text-destructive">
          만들지 못했어요. 이미 다른 가족에 들어가 있는지 확인해 주세요.
        </p>
      )}
    </form>
  );
}
