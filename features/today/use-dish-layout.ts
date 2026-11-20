"use client";

import { useCallback, useSyncExternalStore } from "react";

export type DishLayout = "list" | "grid";

const KEY = "babtol_dish_layout";
const EVENT = "babtol-dish-layout";

const subscribe = (notify: () => void) => {
  window.addEventListener("storage", notify);
  window.addEventListener(EVENT, notify);
  return () => {
    window.removeEventListener("storage", notify);
    window.removeEventListener(EVENT, notify);
  };
};

const read = (): DishLayout => (localStorage.getItem(KEY) === "grid" ? "grid" : "list");

/** 메뉴를 한 줄 목록과 2열 타일 중 어떻게 볼지. 이 기기에 기억하고, 화면의 모든 카드가 함께 바뀐다. */
export function useDishLayout(): [DishLayout, (next: DishLayout) => void] {
  const layout = useSyncExternalStore(subscribe, read, () => "list" as const);
  const set = useCallback((next: DishLayout) => {
    localStorage.setItem(KEY, next);
    window.dispatchEvent(new Event(EVENT));
  }, []);
  return [layout, set];
}
