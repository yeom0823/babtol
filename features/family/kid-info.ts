/** 생년월(YYYY-MM-01)로 today 기준 만 개월 수를 센다. 생년월이 없으면 null. */
export function monthsOld(birthMonth: string | null, today: string): number | null {
  if (!birthMonth) return null;
  const [by, bm] = birthMonth.split("-").map(Number);
  const [ty, tm] = today.split("-").map(Number);
  return Math.max(0, (ty - by) * 12 + (tm - bm));
}

/** "땅콩, 새우 메밀"처럼 적은 알레르기를 하나씩 나눈다. 같은 것은 한 번만. */
export function parseAllergies(text: string): string[] {
  return [...new Set(text.split(/[,\s]+/).map((s) => s.trim()).filter(Boolean))];
}

/** 추천 프롬프트에 넣을 아이 설명. 아이가 없으면 null. */
export function describeKids(kids: { name: string; birthMonth: string | null }[], today: string): string | null {
  if (!kids.length) return null;
  return kids
    .map((k) => {
      const m = monthsOld(k.birthMonth, today);
      return `${k.name}(${m === null ? "개월 수 모름" : `${m}개월`})`;
    })
    .join(", ");
}
