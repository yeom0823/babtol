import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // tesseract.js는 워커 스레드와 언어 데이터를 런타임에 불러와서 번들하지 않고 Node에서 그대로 쓴다.
  serverExternalPackages: ["tesseract.js"],
};

export default nextConfig;
