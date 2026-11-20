import { notFound } from "next/navigation";
import { connection } from "next/server";

import { BackLink } from "@/components/back-link";
import { BrandHero } from "@/components/brand-hero";
import { Button } from "@/components/ui/button";
import { getChild } from "@/features/family/server";

import { deleteChildAction, saveChildAction } from "../actions";
import { ChildForm } from "./child-form";

/** 아이 추가(/children/new)와 고치기(/children/아이ID). */
export default async function ChildPage(props: PageProps<"/children/[id]">) {
  await connection();
  const { id } = await props.params;
  const isNew = id === "new";
  const child = isNew ? null : await getChild(id);
  if (!isNew && !child) notFound();

  return (
    <>
      <BackLink href="/kid">우리 아이</BackLink>
      <BrandHero
        size="sm"
        title={isNew ? "아이를 알려 주세요" : `${child!.name} 정보`}
        description="개월 수와 알레르기에 맞춰 집 끼니를 골라요."
      />
      <section className="rounded-3xl bg-primary/8 p-5">
        <ChildForm
          initial={{
            name: child?.name ?? "",
            birthMonth: child?.birthMonth?.slice(0, 7) ?? "",
            allergies: child?.allergies.join(", ") ?? "",
          }}
          save={saveChildAction.bind(null, isNew ? null : id)}
        />
      </section>
      {!isNew && (
        <form action={deleteChildAction.bind(null, id)} className="flex justify-center">
          <Button type="submit" variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive">
            이 아이 정보 지우기
          </Button>
        </form>
      )}
    </>
  );
}
