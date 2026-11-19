"use client";

import { useActionState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";

import { saveManualMenu } from "./actions";

export function ManualMenuForm({ date, dateLabel }: { date: string; dateLabel: string }) {
  const [state, action, pending] = useActionState(saveManualMenu, null);
  return (
    <Card>
      <CardContent>
        <form action={action} className="flex flex-col gap-3">
          <input type="hidden" name="date" value={date} />
          <Field data-invalid={state ? true : undefined}>
            <FieldLabel htmlFor="lunch">{dateLabel} 어린이집 메뉴 직접 적기</FieldLabel>
            <Textarea
              id="lunch"
              name="lunch"
              className="min-h-28"
              placeholder="예: 잡곡밥, 두부장국, 생선까스, 양배추무침"
              aria-invalid={state ? true : undefined}
            />
            <FieldDescription>쉼표로 나눠 적으면 돼요. 간식은 안 적어도 괜찮아요.</FieldDescription>
          </Field>
          {state && (
            <Alert variant="destructive" role="alert">
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}
          <Button type="submit" disabled={pending}>
            {pending && <Spinner data-icon="inline-start" />}이 메뉴로 추천받기
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
