import type { NextConfig } from "next";

// tesseract.js가 워커 스레드에서 불러오는 파일과 의존 패키지. 파일 추적이 이 경로를 따라가지 못해
// Vercel 배포본에서 빠지면 사진 읽기가 "Cannot find module '..'"로 죽는다.
const TESSERACT_FILES = [
  "tesseract.js",
  "tesseract.js-core",
  "bmp-js",
  "idb-keyval",
  "is-url",
  "node-fetch",
  "regenerator-runtime",
  "wasm-feature-detect",
  "zlibjs",
].map((name) => `./node_modules/${name}/**/*`);

const nextConfig: NextConfig = {
  // tesseract.js는 워커 스레드와 언어 데이터를 런타임에 불러와서 번들하지 않고 Node에서 그대로 쓴다.
  serverExternalPackages: ["tesseract.js"],
  outputFileTracingIncludes: {
    "/api/menu-reading": TESSERACT_FILES,
  },
};

export default nextConfig;
