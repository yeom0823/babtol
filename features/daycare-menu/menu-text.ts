export type DayMenu = {
  morningSnack: string[];
  lunch: string[];
  afternoonSnack: string[];
};

/** 쉼표와 줄바꿈으로 나눈 메뉴 이름 목록. 빈 칸은 버린다. */
export function parseDishList(text: string): string[] {
  return text
    .split(/[,\n]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * "점심 · 잡곡밥, 두부장국" / "간식 · 오전간식 / 오후간식" 형식의 하루 식단 글을 읽는다.
 * 점심이 없으면 읽지 못한 것으로 보고 null을 준다.
 */
export function parseDayMenu(text: string): DayMenu | null {
  let lunch: string[] = [];
  let morningSnack: string[] = [];
  let afternoonSnack: string[] = [];
  for (const line of text.split("\n")) {
    const [label, ...rest] = line.split("·");
    const body = rest.join("·");
    if (label.trim() === "점심") lunch = parseDishList(body);
    if (label.trim() === "간식") {
      const [am = "", pm = ""] = body.split("/");
      morningSnack = parseDishList(am);
      afternoonSnack = parseDishList(pm);
    }
  }
  return lunch.length ? { lunch, morningSnack, afternoonSnack } : null;
}

export function formatDayMenu(menu: DayMenu): string {
  const lines = [`점심 · ${menu.lunch.join(", ")}`];
  if (menu.morningSnack.length || menu.afternoonSnack.length) {
    lines.push(
      `간식 · ${menu.morningSnack.join(", ")} / ${menu.afternoonSnack.join(", ")}`
    );
  }
  return lines.join("\n");
}
