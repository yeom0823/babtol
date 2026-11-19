import { BackLink } from "@/components/back-link";
import { ManualMenuForm } from "@/features/daycare-menu";
import { describeDay } from "@/features/today";
import { toISODate } from "@/lib/date";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export default async function UploadPage(props: PageProps<"/upload">) {
  const { d } = await props.searchParams;
  const today = toISODate(new Date());
  const date = typeof d === "string" && ISO_DATE.test(d) ? d : today;
  const { label } = describeDay(date, today);

  return (
    <>
      <BackLink href="/">오늘</BackLink>
      <div className="flex flex-col gap-2">
        <h1 className="text-[22px] font-bold tracking-tight">식단표 올리기</h1>
        <p className="m-0 text-[13px] text-muted-foreground">
          키즈노트를 연결하지 않아도 돼요. 어린이집 메뉴를 적으면 그날 추천에 써요.
        </p>
      </div>
      <ManualMenuForm date={date} dateLabel={label} />
    </>
  );
}
