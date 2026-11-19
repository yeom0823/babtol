// 서버에서만 쓴다: 사진 OCR과 링크 가져오기, 모델 호출.
export { htmlToText, imageUrlsIn } from "./html";
export { readMenusFromText, type ReadDay } from "./read-menus";
export { ocrImages, textFromLink } from "./sources";
