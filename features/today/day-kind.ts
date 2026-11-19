import { isWeekend } from "@/lib/date";
import type { DayMenu } from "@/features/daycare-menu";

/** daycare: 어린이집 식단이 있는 평일, missing: 식단이 아직 없는 평일, off: 주말. */
export type DayKind = "daycare" | "missing" | "off";

export function dayKind(iso: string, menu: DayMenu | null): DayKind {
  if (isWeekend(iso)) return "off";
  return menu ? "daycare" : "missing";
}
