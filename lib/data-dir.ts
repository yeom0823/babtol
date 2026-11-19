import { tmpdir } from "node:os";
import { join } from "node:path";

/**
 * 로컬 앱 데이터(저장 파일, OCR 언어 데이터)를 두는 폴더.
 * 로컬에서는 프로젝트의 .data(git이 무시), Vercel처럼 프로젝트 폴더가 읽기 전용인 곳에서는
 * 임시 폴더를 쓴다. 임시 폴더는 서버가 다시 뜨면 지워질 수 있다.
 */
export function dataDir(): string {
  if (process.env.HOME_MEAL_DATA_DIR) return process.env.HOME_MEAL_DATA_DIR;
  return process.env.VERCEL ? join(tmpdir(), "home-meal") : join(process.cwd(), ".data");
}
