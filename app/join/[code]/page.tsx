import Link from "next/link";
import { connection } from "next/server";

import { BrandHero } from "@/components/brand-hero";
import { buttonVariants } from "@/components/ui/button";
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
  const home = (
    <Link href="/" className={`${buttonVariants({ size: "lg" })} h-11 w-full rounded-full text-[15px]`}>
      밥톨로 가기
    </Link>
  );

  return (
    <div className="flex flex-1 flex-col justify-center gap-6 py-8">
      {!invite || invite.expired ? (
        <>
          <BrandHero
            title="초대 링크가 맞지 않아요"
            description={`${invite?.expired ? "기간(7일)이 지난 링크예요." : "없는 링크예요."} 가족에게 새 링크를 받아 주세요.`}
          />
          {home}
        </>
      ) : mine ? (
        <>
          <BrandHero title="이미 가족에 들어가 있어요" description="한 사람은 한 가족에만 들어갈 수 있어요." />
          {home}
        </>
      ) : (
        <>
          <BrandHero
            title={
              <>
                <span className="text-primary">{invite.familyName}</span>에
                <br />
                초대받았어요
              </>
            }
            description="들어가면 가족과 식단, 먹은 반응, 아이 정보를 함께 봐요."
          />
          <JoinButton join={joinFamilyAction.bind(null, code)} />
        </>
      )}
    </div>
  );
}
