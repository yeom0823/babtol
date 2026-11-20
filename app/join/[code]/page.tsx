import Link from "next/link";
import { connection } from "next/server";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { inviteInfo } from "@/features/family/server";
import { currentFamilyId } from "@/lib/current-family";

import { joinFamilyAction } from "../../family/actions";
import { JoinButton } from "./join-button";

/** 초대 링크로 들어오는 곳. 로그인은 proxy.ts가 먼저 받는다. */
export default async function JoinPage(props: PageProps<"/join/[code]">) {
  await connection();
  const { code } = await props.params;
  const invite = await inviteInfo(code);
  const mine = await currentFamilyId();

  return (
    <div className="flex flex-1 flex-col gap-4 py-6">
      <Card>
        {!invite || invite.expired ? (
          <CardHeader>
            <CardTitle className="text-lg">초대 링크가 맞지 않아요</CardTitle>
            <CardDescription>
              {invite?.expired ? "기간이 지난 링크예요." : "없는 링크예요."} 가족에게 새 링크를 받아 주세요.
            </CardDescription>
          </CardHeader>
        ) : mine ? (
          <>
            <CardHeader>
              <CardTitle className="text-lg">이미 가족에 들어가 있어요</CardTitle>
              <CardDescription>한 사람은 한 가족에만 들어갈 수 있어요.</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/" className={buttonVariants()}>
                밥톨로 가기
              </Link>
            </CardContent>
          </>
        ) : (
          <>
            <CardHeader>
              <CardTitle className="text-lg">{invite.familyName}에 초대받았어요</CardTitle>
              <CardDescription>들어가면 가족과 식단, 먹은 반응, 아이 정보를 함께 봐요.</CardDescription>
            </CardHeader>
            <CardContent>
              <JoinButton join={joinFamilyAction.bind(null, code)} />
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
}
