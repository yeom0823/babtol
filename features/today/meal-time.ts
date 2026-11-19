export type Meal = "breakfast" | "lunch" | "snack" | "dinner";

/** 시간 기준(가정 A3): 오전 10시 전 아침, 오후 3시 전 점심, 오후 5시 전 간식, 그 뒤 저녁. */
export function mealAtHour(hour: number): Meal {
  if (hour < 10) return "breakfast";
  if (hour < 15) return "lunch";
  if (hour < 17) return "snack";
  return "dinner";
}
