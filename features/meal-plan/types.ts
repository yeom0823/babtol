import type { FoodGroup } from "./food-groups";

export type MealKey = "breakfast" | "lunch" | "snack" | "dinner";

export type Recipe = {
  minutes: number;
  /** 한 번 끓여 몇 끼에 나눠 먹는 분량. 2~3이면 다음 날 저녁에 이어 쓴다(가정 A8). */
  servings: number;
  ingredients: { name: string; amount: string }[];
  steps: string[];
  /** "두 돌 아이에게 줄 때" 주의(싱겁게, 잘게, 질식 위험 자르기). */
  kidNote: string;
};

export type HomeDish = {
  name: string;
  groups: FoodGroup[];
  mainIngredients: string[];
  /** 밥처럼 기본으로 곁들이는 음식. 바꾸기와 레시피가 없다. */
  basic?: boolean;
  /** 어제 끓인 국을 데워 먹는 메뉴(가정 A8). 장보기에서 재료를 뺀다. */
  leftover?: boolean;
  recipe: Recipe;
};

export type HomeMeal = { why: string; dishes: HomeDish[] };

export type DayPlan = Partial<Record<MealKey, HomeMeal>>;
