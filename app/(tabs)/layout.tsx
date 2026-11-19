import { BottomTabBar, type TabItem } from "@/components/bottom-tab-bar";

const TABS: TabItem[] = [
  { href: "/", label: "오늘", icon: "🍚" },
  { href: "/shop", label: "장보기", icon: "🛒" },
  { href: "/favs", label: "잘 먹은 메뉴", icon: "😋" },
];

export default function TabsLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <div className="flex flex-1 flex-col gap-4 py-4">{children}</div>
      <BottomTabBar items={TABS} />
    </>
  );
}
