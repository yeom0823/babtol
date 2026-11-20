"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function DisplayNameForm({
  initial,
  save,
}: {
  initial: string;
  save: (prev: unknown, form: FormData) => Promise<{ ok: boolean; message: string }>;
}) {
  const [state, action, pending] = useActionState(save, null);
  return (
    <form action={action} className="flex flex-col gap-1.5">
      <label htmlFor="displayName" className="px-1 text-sm font-semibold">
        가족에게 보일 이름
      </label>
      <div className="flex gap-2">
        <Input
          id="displayName"
          name="displayName"
          defaultValue={initial}
          maxLength={30}
          placeholder="엄마, 아빠, 할머니"
          className="h-11 rounded-full bg-background px-4 text-base"
        />
        <Button type="submit" className="h-11 rounded-full px-5" disabled={pending}>
          저장
        </Button>
      </div>
      {state && (
        <p role={state.ok ? "status" : "alert"} className={state.ok ? "m-0 px-1 text-xs text-muted-foreground" : "m-0 px-1 text-xs text-destructive"}>
          {state.message}
        </p>
      )}
    </form>
  );
}
