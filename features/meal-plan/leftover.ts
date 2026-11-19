import type { DayPlan, HomeDish } from "./types";

const isSoup = (name: string) => /(국|탕|찌개)$/.test(name);

/**
 * 전날 저녁에 2~3회 분량으로 끓인 국. 다음 날 저녁 국 자리에 한 번 이어 쓴다(가정 A8).
 * 이미 이어 쓴 국은 다시 잇지 않는다.
 */
export function leftoverSoupOf(prev: DayPlan | null): HomeDish | null {
  const soup = prev?.dinner?.dishes.find(
    (d) =>
      !d.basic &&
      !d.leftover &&
      isSoup(d.name) &&
      d.recipe.servings >= 2 &&
      d.recipe.servings <= 3
  );
  return soup ?? null;
}
