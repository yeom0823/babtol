// 클라이언트 컴포넌트에서도 쓸 수 있는 공개 API: 타입, 식품군, 순수 계산만 담는다.
// 모델 호출과 저장소(node:fs)는 ./server에 있다.
export { dayCoverage } from "./day-coverage";
export {
  FOOD_GROUPS,
  canonicalIngredient,
  foodGroupsOfText,
  mainIngredientsOf,
  type FoodGroup,
} from "./food-groups";
export { leftoverSoupOf } from "./leftover";
export { MEAL_KO, mealsFor, type PlanInput } from "./prompt";
export type { DayPlan, HomeDish, HomeMeal, MealKey, Recipe } from "./types";
