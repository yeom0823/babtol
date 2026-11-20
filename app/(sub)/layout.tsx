import { requireFamily } from "@/lib/current-family";

export default async function SubLayout({ children }: LayoutProps<"/">) {
  await requireFamily();
  return <div className="flex flex-1 flex-col gap-4 py-4">{children}</div>;
}
