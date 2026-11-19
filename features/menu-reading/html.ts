const ENTITIES: Record<string, string> = {
  "&nbsp;": " ",
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
};

/** 웹페이지에서 스크립트·스타일과 태그를 빼고 글만 남긴다. 표의 칸과 줄은 구분해서 남긴다. */
export function htmlToText(html: string): string {
  return html
    .replace(/<(script|style|noscript)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<\/(td|th)>/gi, " | ")
    .replace(/<(br|\/p|\/div|\/tr|\/li|\/h[1-6])[^>]*>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z#0-9]+;/gi, (e) => ENTITIES[e.toLowerCase()] ?? " ")
    .split("\n")
    .map((line) => line.replace(/[ \t]+/g, " ").trim())
    .filter(Boolean)
    .join("\n");
}

/** 웹페이지의 대표 이미지(og:image)와 본문 이미지 주소를 절대 주소로 모은다(가정 A11). */
export function imageUrlsIn(html: string, base: string): string[] {
  const urls: string[] = [];
  const og = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i);
  if (og) urls.push(og[1]);
  for (const m of html.matchAll(/<img[^>]+src=["']([^"']+)["']/gi)) urls.push(m[1]);
  const absolute = urls
    .filter((u) => !u.startsWith("data:"))
    .map((u) => {
      try {
        return new URL(u, base).toString();
      } catch {
        return null;
      }
    })
    .filter((u): u is string => u !== null);
  return [...new Set(absolute)];
}
