import { notFound } from "next/navigation";
import { connection } from "next/server";

import { BackLink } from "@/components/back-link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
      <h1 className="text-[22px] font-bold tracking-tight">{isNew ? "아이 추가" : `${child!.name} 정보`}</h1>
      <Card>
        <CardContent>
          <ChildForm
            initial={{
              name: child?.name ?? "",
              birthMonth: child?.birthMonth?.slice(0, 7) ?? "",
              allergies: child?.allergies.join(", ") ?? "",
            }}
            save={saveChildAction.bind(null, isNew ? null : id)}
          />
        </CardContent>
      </Card>
      {!isNew && (
        <form action={deleteChildAction.bind(null, id)}>
          <Button type="submit" variant="ghost" size="sm" className="text-destructive">
            이 아이 정보 지우기
          </Button>
        </form>
      )}
    </>
  );
}
