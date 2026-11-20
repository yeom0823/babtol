import { LinkIcon } from "lucide-react";
import { redirect } from "next/navigation";
import { connection } from "next/server";

import { BrandHero } from "@/components/brand-hero";
import { currentFamilyId } from "@/lib/current-family";

import { createFamilyAction } from "../actions";
import { CreateFamilyForm } from "./create-family-form";

/** 로그인했지만 가족이 없을 때 오는 곳: 새 가족을 만들거나, 받은 초대 링크를 열도록 안내한다. */
export default async function FamilyStartPage() {
  await connection();
  if (await currentFamilyId()) redirect("/");
  return (
    <div className="flex flex-1 flex-col justify-center gap-6 py-8">
      <BrandHero title="가족과 함께 시작해요" description="밥톨은 가족이 함께 식단을 보고, 먹은 반응과 아이 정보를 나눠요." />

      <section className="flex flex-col gap-3 rounded-3xl bg-primary/8 p-5">
        <div className="flex flex-col gap-0.5">
          <h2 className="font-cute text-lg text-primary">새 가족 만들기</h2>
          <p className="m-0 text-[13px] text-muted-foreground">처음 쓰는 사람이 만들고, 다른 가족은 초대 링크로 들어와요.</p>
        </div>
        <CreateFamilyForm create={createFamilyAction} />
      </section>

      <div className="flex items-start gap-2.5 rounded-2xl border border-dashed px-4 py-3 text-[13px] text-muted-foreground">
        <LinkIcon aria-hidden="true" className="mt-0.5 size-4 flex-none" />
        <span>가족에게 초대 링크를 받았다면, 이 화면 대신 그 링크를 열어 주세요.</span>
      </div>
    </div>
  );
}
