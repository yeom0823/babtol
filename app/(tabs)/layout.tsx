import { BottomTabBar, type TabItem } from "@/components/bottom-tab-bar";

// 탭은 화면이 생기는 대로 하나씩 늘린다.
const TABS: TabItem[] = [{ href: "/", label: "오늘", icon: "🍚" }];

export default function TabsLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <div className="flex flex-1 flex-col gap-4 py-4">{children}</div>
      <BottomTabBar items={TABS} />
    </>
  );
}
