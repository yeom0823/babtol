import { redirect } from "next/navigation";
import { connection } from "next/server";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { currentFamilyId } from "@/lib/current-family";

import { createFamilyAction } from "../actions";
import { CreateFamilyForm } from "./create-family-form";

/** 로그인했지만 가족이 없을 때 오는 곳: 새 가족을 만들거나, 받은 초대 링크를 열도록 안내한다. */
export default async function FamilyStartPage() {
  await connection();
  if (await currentFamilyId()) redirect("/");
  return (
    <div className="flex flex-1 flex-col gap-4 py-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-[22px] font-bold tracking-tight">가족과 함께 시작해요</h1>
        <p className="m-0 text-[13px] text-muted-foreground">
          밥톨은 가족 단위로 식단, 먹은 반응, 아이 정보를 함께 봐요.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">새 가족 만들기</CardTitle>
          <CardDescription>처음 쓰는 사람이 만들고, 다른 가족은 초대 링크로 들어와요.</CardDescription>
        </CardHeader>
        <CardContent>
          <CreateFamilyForm create={createFamilyAction} />
        </CardContent>
      </Card>
      <Card size="sm">
        <CardContent className="text-[13px] text-muted-foreground">
          가족에게 초대 링크를 받았다면, 이 화면 대신 그 링크를 열어 주세요.
        </CardContent>
      </Card>
    </div>
  );
}
