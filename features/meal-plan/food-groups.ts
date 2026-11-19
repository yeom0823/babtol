export const FOOD_GROUPS = [
  "곡류",
  "고기·생선·달걀·콩",
  "채소",
  "과일",
  "우유·유제품",
] as const;
export type FoodGroup = (typeof FOOD_GROUPS)[number];

const [GRAIN, PROTEIN, VEG, FRUIT, DAIRY] = FOOD_GROUPS;

/**
 * 재료 표. 순서가 중요하다: 앞 항목이 글자를 먼저 가져가서 뒤 항목이 다시 세지 않는다
 * (예: "양배추"가 "배추"보다 앞). main이 참인 것만 어린이집과 겹침을 따지는 주재료다(가정 A5).
 */
type Entry = { name: string; group: FoodGroup; main: boolean; pattern: string };
const TABLE: Entry[] = [
  { name: "소고기", group: PROTEIN, main: true, pattern: "소고기|쇠고기|소불고기|양지" },
  { name: "돼지고기", group: PROTEIN, main: true, pattern: "돼지|제육|삼겹|수육" },
  { name: "닭고기", group: PROTEIN, main: true, pattern: "닭|치킨" },
  { name: "오리", group: PROTEIN, main: true, pattern: "오리" },
  { name: "생선", group: PROTEIN, main: true, pattern: "생선|삼치|고등어|갈치|조기|명태|동태|대구|연어|가자미|임연수|참치|북어|황태" },
  { name: "새우", group: PROTEIN, main: true, pattern: "새우" },
  { name: "오징어", group: PROTEIN, main: true, pattern: "오징어" },
  { name: "어묵", group: PROTEIN, main: true, pattern: "어묵" },
  { name: "두부", group: PROTEIN, main: true, pattern: "두부" },
  { name: "달걀", group: PROTEIN, main: true, pattern: "달걀|계란|에그|오믈렛" },
  { name: "콩", group: PROTEIN, main: true, pattern: "콩(?!나물)" },
  { name: "콩나물", group: VEG, main: true, pattern: "콩나물" },
  { name: "시금치", group: VEG, main: true, pattern: "시금치" },
  { name: "브로콜리", group: VEG, main: true, pattern: "브로콜리" },
  { name: "단호박", group: VEG, main: true, pattern: "단호박" },
  { name: "애호박", group: VEG, main: true, pattern: "애호박|호박" },
  { name: "당근", group: VEG, main: true, pattern: "당근" },
  { name: "양배추", group: VEG, main: true, pattern: "양배추" },
  { name: "배추", group: VEG, main: true, pattern: "배추" },
  { name: "오이", group: VEG, main: true, pattern: "오이" },
  { name: "무", group: VEG, main: true, pattern: "무(?!침|지)" },
  { name: "숙주", group: VEG, main: true, pattern: "숙주" },
  { name: "감자", group: VEG, main: true, pattern: "감자" },
  { name: "미역", group: VEG, main: true, pattern: "미역" },
  { name: "버섯", group: VEG, main: true, pattern: "버섯" },
  { name: "파프리카", group: VEG, main: true, pattern: "파프리카" },
  { name: "가지", group: VEG, main: true, pattern: "가지" },
  { name: "청경채", group: VEG, main: true, pattern: "청경채" },
  { name: "깻잎", group: VEG, main: true, pattern: "깻잎" },
  { name: "양파", group: VEG, main: true, pattern: "양파" },
  { name: "부추", group: VEG, main: true, pattern: "부추" },
  { name: "상추", group: VEG, main: true, pattern: "상추" },
  { name: "토마토", group: VEG, main: true, pattern: "토마토" },
  { name: "고구마", group: GRAIN, main: true, pattern: "고구마" },
  { name: "옥수수", group: GRAIN, main: true, pattern: "옥수수" },
  { name: "바나나", group: FRUIT, main: false, pattern: "바나나" },
  { name: "사과", group: FRUIT, main: false, pattern: "사과" },
  { name: "귤", group: FRUIT, main: false, pattern: "귤" },
  { name: "배", group: FRUIT, main: false, pattern: "배(?!추)" },
  { name: "딸기", group: FRUIT, main: false, pattern: "딸기" },
  { name: "포도", group: FRUIT, main: false, pattern: "포도" },
  { name: "수박", group: FRUIT, main: false, pattern: "수박" },
  { name: "참외", group: FRUIT, main: false, pattern: "참외" },
  { name: "키위", group: FRUIT, main: false, pattern: "키위" },
  { name: "복숭아", group: FRUIT, main: false, pattern: "복숭아" },
  { name: "오렌지", group: FRUIT, main: false, pattern: "오렌지" },
  { name: "블루베리", group: FRUIT, main: false, pattern: "블루베리" },
  { name: "우유", group: DAIRY, main: false, pattern: "우유" },
  { name: "요거트", group: DAIRY, main: false, pattern: "요거트|요구르트" },
  { name: "치즈", group: DAIRY, main: false, pattern: "치즈" },
  { name: "두유", group: DAIRY, main: false, pattern: "두유" },
  {
    name: "곡류",
    group: GRAIN,
    main: false,
    pattern: "밥|죽|빵|국수|우동|라면|소면|파스타|스파게티|수제비|떡|씨리얼|시리얼|오트밀|토스트|샌드위치|만두|누룽지|크래커",
  },
];

/** 밥·김치·깍두기·단무지는 기본 음식이라 겹침에서 뺀다(가정 A6). 우유는 main이 아니라 따로 빠진다. */
const BASE_FOODS = /[가-힣]*김치|깍두기|단무지/g;

const aliases = TABLE.filter((e) => e.name !== "곡류");

/** 같은 재료의 다른 이름(쇠고기, 계란, 닭 …)을 하나로 모은다. */
export function canonicalIngredient(name: string): string {
  const trimmed = name.trim();
  const hit = aliases.find((e) => new RegExp(e.pattern).test(trimmed));
  return hit ? hit.name : trimmed;
}

function scan(text: string, mainOnly: boolean): Entry[] {
  let rest = text.replace(BASE_FOODS, " ");
  const found: Entry[] = [];
  for (const entry of TABLE) {
    if (mainOnly && !entry.main) continue;
    const re = new RegExp(entry.pattern, "g");
    if (re.test(rest)) {
      found.push(entry);
      rest = rest.replace(new RegExp(entry.pattern, "g"), " ");
    }
  }
  return found;
}

/** 어린이집 메뉴 글에서 주재료(고기, 생선, 두부, 주요 채소)를 찾는다. */
export function mainIngredientsOf(text: string): string[] {
  return scan(text, true).map((e) => e.name);
}

/** 메뉴 글이 채우는 식품군. */
export function foodGroupsOfText(text: string): FoodGroup[] {
  const groups = new Set(scan(text, false).map((e) => e.group));
  return FOOD_GROUPS.filter((g) => groups.has(g));
}

/** 식품군마다 어느 끼니에서 채웠는지 출처를 모은다. */
export function dayGroupSources(
  parts: { label: string; groups: FoodGroup[] }[]
): Record<FoodGroup, string[]> {
  const out = Object.fromEntries(FOOD_GROUPS.map((g) => [g, [] as string[]])) as Record<
    FoodGroup,
    string[]
  >;
  for (const part of parts) {
    for (const g of part.groups) if (!out[g].includes(part.label)) out[g].push(part.label);
  }
  return out;
}
