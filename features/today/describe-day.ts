import { parseISODate } from "@/lib/date";

const DOW = ["일", "월", "화", "수", "목", "금", "토"];

export function describeDay(iso: string, todayIso: string) {
  const d = parseISODate(iso);
  const diff = Math.round((d.getTime() - parseISODate(todayIso).getTime()) / 864e5);
  const relative =
    diff === 0
      ? ""
      : diff === -1
        ? "어제"
        : diff === 1
          ? "내일"
          : diff < 0
            ? `${-diff}일 전`
            : `${diff}일 뒤`;
  const note =
    diff < 0
      ? "지난 끼니예요. 먹인 반응을 지금 눌러도 돼요."
      : diff > 0
        ? "미리 보는 추천이에요. 장 볼 때 참고하세요."
        : null;
  return { label: `${d.getMonth() + 1}월 ${d.getDate()}일 ${DOW[d.getDay()]}요일`, relative, note };
}
