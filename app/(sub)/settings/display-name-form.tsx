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
    <form action={action} className="flex flex-col gap-2">
      <label htmlFor="displayName" className="text-sm font-semibold">
        이름
      </label>
      <div className="flex gap-2">
        <Input id="displayName" name="displayName" defaultValue={initial} maxLength={30} placeholder="가족에게 보일 이름" />
        <Button type="submit" disabled={pending}>
          저장
        </Button>
      </div>
      {state && (
        <p role={state.ok ? "status" : "alert"} className={state.ok ? "m-0 text-xs text-muted-foreground" : "m-0 text-xs text-destructive"}>
          {state.message}
        </p>
      )}
    </form>
  );
}
