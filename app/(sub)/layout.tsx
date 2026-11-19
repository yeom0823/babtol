export default function SubLayout({ children }: LayoutProps<"/">) {
  return <div className="flex flex-1 flex-col gap-4 py-4">{children}</div>;
}
