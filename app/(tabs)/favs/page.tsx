import { connection } from "next/server";
import { listFavorites, listResting } from "@/features/meal-feedback";
import type { MealKey } from "@/features/meal-plan";
import { findDishByName } from "@/features/meal-plan/server";
import { toISODate } from "@/lib/date";

import { insertFavoriteAction, releaseRestingAction } from "../actions";
import { FavoriteList } from "./favorite-list";
import { RestingList } from "./resting-list";

export default async function FavoritesPage() {
  // 로컬 파일을 요청 때마다 읽으므로 빌드 때 굳지 않게 동적으로 그린다.
  await connection();
  const today = toISODate(new Date());
  const favorites = await listFavorites(today);
  const items = await Promise.all(
    favorites.map(async (f) => ({ ...f, meal: f.meal as MealKey, dish: await findDishByName(f.name) }))
  );
  const resting = await listResting(today);

  return (
    <>
      <div className="flex flex-col gap-2">
        <h1 className="text-[22px] font-bold tracking-tight">잘 먹은 메뉴</h1>
        <p className="m-0 text-[13px] text-muted-foreground">
          &quot;잘 먹음&quot;을 누른 메뉴를 모았어요. 고민될 때 여기서 골라 바로 끼니에 넣을 수 있어요.
        </p>
      </div>
      <FavoriteList items={items} insert={insertFavoriteAction} />
      <RestingList items={resting} release={releaseRestingAction} />
    </>
  );
}
