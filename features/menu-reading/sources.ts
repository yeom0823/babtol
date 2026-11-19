import { mkdir } from "node:fs/promises";
import { join } from "node:path";

import { createWorker, PSM } from "tesseract.js";

import { htmlToText, imageUrlsIn } from "./html";

/**
 * 사진의 글자를 무료 OCR(tesseract.js, 한국어+영어)로 뽑는다. 무료 모델 가운데 사진을 읽는 모델이
 * 없어서 글자만 먼저 뽑는다(스펙 제약). 언어 데이터는 git이 무시하는 .data/ 아래에 둔다.
 * 사진은 읽는 데만 쓰고 저장하지 않는다.
 */
export async function ocrImages(images: Buffer[]): Promise<string> {
  if (!images.length) return "";
  const cachePath = join(process.cwd(), ".data", "tesseract");
  await mkdir(cachePath, { recursive: true });
  const worker = await createWorker(["kor", "eng"], undefined, { cachePath });
  try {
    // 표로 된 식단표는 기본값(한 덩어리 글)로 읽으면 표를 통째로 놓친다.
    await worker.setParameters({ tessedit_pageseg_mode: PSM.AUTO });
    const texts: string[] = [];
    for (const image of images) texts.push((await worker.recognize(image)).data.text);
    return texts.join("\n\n");
  } finally {
    await worker.terminate();
  }
}

async function get(url: string): Promise<Response> {
  return fetch(url, {
    headers: { "user-agent": "Mozilla/5.0 (home-meal local app)" },
    signal: AbortSignal.timeout(20_000),
  });
}

async function imageBuffer(res: Response): Promise<Buffer> {
  return Buffer.from(await res.arrayBuffer());
}

/**
 * 식단표 링크를 글로 바꾼다(가정 A11). 이미지 주소면 OCR로 읽고, 웹페이지면 본문 글과
 * 대표·본문 이미지(최대 3장)의 글자를 함께 쓴다.
 */
export async function textFromLink(url: string): Promise<string> {
  const res = await get(url);
  if (!res.ok) return "";
  const type = res.headers.get("content-type") ?? "";
  if (type.startsWith("image/")) return ocrImages([await imageBuffer(res)]);
  const html = await res.text();
  const pageText = htmlToText(html);
  const images: Buffer[] = [];
  for (const src of imageUrlsIn(html, res.url || url).slice(0, 3)) {
    const img = await get(src).catch(() => null);
    if (img?.ok && (img.headers.get("content-type") ?? "").startsWith("image/")) {
      images.push(await imageBuffer(img));
    }
  }
  return [pageText, await ocrImages(images)].filter(Boolean).join("\n\n");
}
