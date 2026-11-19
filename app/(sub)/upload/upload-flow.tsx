"use client";

import { useActionState, useEffect, useRef, useState, type ReactNode } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { formatDayMenu, saveReadMenus, type DayMenu } from "@/features/daycare-menu";
import { parseISODate } from "@/lib/date";
import { cn } from "@/lib/utils";

type ReadDay = { date: string; menu: DayMenu; unsure: string[] };
type Step = "choose" | "reading" | "result" | "failed";

const DOW = ["일", "월", "화", "수", "목", "금", "토"];
const dayLabel = (iso: string) => {
  const d = parseISODate(iso);
  return `${d.getDate()} ${DOW[d.getDay()]}`;
};
const rangeTitle = (days: ReadDay[]) => {
  const first = parseISODate(days[0].date);
  const last = parseISODate(days.at(-1)!.date);
  const span =
    days.length === 1
      ? `${first.getMonth() + 1}월 ${first.getDate()}일`
      : `${first.getMonth() + 1}월 ${first.getDate()}일 ~ ${last.getDate()}일`;
  return `${span}, ${days.length}일 식단을 읽었어요`;
};

/** 식단표 사진(여러 장)이나 링크를 올려 날짜별 메뉴를 읽고, 확인하고 고친 뒤 저장한다(AC4). */
export function UploadFlow({ fallback }: { fallback: ReactNode }) {
  const [mode, setMode] = useState<"photo" | "link">("photo");
  const [photos, setPhotos] = useState<File[]>([]);
  const [url, setUrl] = useState("");
  const [step, setStep] = useState<Step>("choose");
  const [days, setDays] = useState<ReadDay[]>([]);
  const [texts, setTexts] = useState<Record<string, string>>({});
  const [saveState, saveAction, saving] = useActionState(saveReadMenus, null);
  const previews = useObjectUrls(photos);

  const addPhotos = (files: FileList | null) => {
    if (files?.length) setPhotos((prev) => [...prev, ...Array.from(files)]);
  };

  const read = async () => {
    setStep("reading");
    const form = new FormData();
    if (mode === "photo") photos.forEach((p) => form.append("photos", p));
    else form.append("url", url.trim());
    try {
      const res = await fetch("/api/menu-reading", { method: "POST", body: form });
      const body = (await res.json()) as { days: ReadDay[] };
      if (!body.days?.length) return setStep("failed");
      setDays(body.days);
      setTexts(Object.fromEntries(body.days.map((d) => [d.date, formatDayMenu(d.menu)])));
      setStep("result");
    } catch {
      setStep("failed");
    }
  };

  const restart = () => {
    setStep("choose");
    setDays([]);
  };

  if (step === "reading") {
    return (
      <Card aria-busy="true">
        <CardContent className="flex flex-col gap-2.5">
          <p role="status" className="m-0 flex items-center gap-2 text-sm text-muted-foreground">
            <Spinner /> 식단표에서 날짜와 메뉴를 찾는 중이에요
          </p>
          <Skeleton className="h-4 w-[70%]" />
          <Skeleton className="h-4 w-[90%]" />
          <Skeleton className="h-4 w-[60%]" />
          <Skeleton className="h-4 w-[80%]" />
        </CardContent>
      </Card>
    );
  }

  if (step === "result") {
    const entries = JSON.stringify(days.map((d) => ({ date: d.date, text: texts[d.date] ?? "" })));
    return (
      <form action={saveAction} className="flex flex-col gap-3">
        <Alert>
          <AlertTitle>✅ {rangeTitle(days)}</AlertTitle>
          <AlertDescription>
            맞게 읽었는지 한 번만 봐 주세요. 색칠한 메뉴는 흐려서 짐작한 거예요. 틀린 곳은 고치면 돼요.
          </AlertDescription>
        </Alert>
        <Card>
          <CardContent className="flex flex-col">
            {days.map((d) => (
              <div key={d.date} className="grid grid-cols-[54px_1fr] gap-2 border-t py-2.5 first:border-t-0 first:pt-0 last:pb-0">
                <label htmlFor={`menu-${d.date}`} className="pt-2 text-[13px] font-bold">
                  {dayLabel(d.date)}
                </label>
                <div className="flex flex-col gap-1.5">
                  <Textarea
                    id={`menu-${d.date}`}
                    value={texts[d.date] ?? ""}
                    onChange={(e) => setTexts((prev) => ({ ...prev, [d.date]: e.target.value }))}
                    className="min-h-16 text-sm"
                  />
                  {d.unsure.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
                      짐작한 메뉴:
                      {d.unsure.map((u) => (
                        <Badge key={u} variant="secondary" className="bg-primary/18 text-foreground">
                          {u}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
        {saveState && (
          <p role="alert" className="m-0 text-[13px] text-destructive">
            {saveState.error}
          </p>
        )}
        <input type="hidden" name="entries" value={entries} />
        <Button type="submit" size="lg" disabled={saving}>
          {saving && <Spinner data-icon="inline-start" />}이대로 저장하고 추천받기
        </Button>
        <Button type="button" variant="ghost" onClick={restart}>
          다른 사진으로 다시 하기
        </Button>
      </form>
    );
  }

  if (step === "failed") {
    return (
      <div className="flex flex-col gap-3">
        <Alert variant="destructive" role="alert">
          <AlertTitle>식단을 찾지 못했어요</AlertTitle>
          <AlertDescription>
            사진이 흐리거나 링크가 열리지 않았어요. 글자가 잘 보이게 다시 찍거나, 메뉴를 직접 적어 주세요.
          </AlertDescription>
        </Alert>
        <Button variant="outline" onClick={restart}>
          📷 다시 올리기
        </Button>
        {fallback}
      </div>
    );
  }

  const canRead = mode === "photo" ? photos.length > 0 : /^https?:\/\/\S+/.test(url.trim());
  return (
    <div className="flex flex-col gap-3">
      <div role="group" aria-label="올리는 방법" className="grid grid-cols-2 gap-1 rounded-full bg-muted p-1">
        {(
          [
            ["photo", "📷 사진"],
            ["link", "🔗 링크"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            aria-pressed={mode === value}
            onClick={() => setMode(value)}
            className={cn(
              "h-9 rounded-full text-sm font-semibold text-muted-foreground",
              mode === value && "bg-background text-foreground shadow-sm"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {mode === "photo" ? (
        photos.length ? (
          <Card>
            <CardContent className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">고른 사진 {photos.length}장</span>
                <label className="cursor-pointer rounded-md px-2.5 py-1 text-[0.8rem] font-medium hover:bg-accent">
                  + 더 고르기
                  <input type="file" accept="image/*" multiple className="sr-only" onChange={(e) => addPhotos(e.target.files)} />
                </label>
              </div>
              <div className="flex flex-wrap gap-2">
                {photos.map((photo, i) => (
                  <div key={`${photo.name}-${i}`} className="relative size-[72px] overflow-hidden rounded-xl border bg-muted">
                    {previews[i] && (
                      // 미리보기는 브라우저 안의 임시 주소라 next/image를 쓰지 않는다.
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={previews[i]} alt={`식단표 사진 ${i + 1}`} className="size-full object-cover" />
                    )}
                    <button
                      type="button"
                      aria-label={`사진 ${i + 1} 빼기`}
                      onClick={() => setPhotos((prev) => prev.filter((_, k) => k !== i))}
                      className="absolute top-1 right-1 grid size-[22px] place-items-center rounded-full border bg-background text-[11px]"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : (
          <label className="flex cursor-pointer flex-col items-center gap-1.5 rounded-2xl border-[1.5px] border-dashed bg-card px-3.5 py-5 text-center hover:bg-accent">
            <input type="file" accept="image/*" multiple className="sr-only" onChange={(e) => addPhotos(e.target.files)} />
            <span className="text-3xl">📷</span>
            <span className="font-bold">사진 찍기 또는 앨범에서 고르기</span>
            <span className="text-xs text-muted-foreground">
              주간·월간 식단표 모두 돼요. 여러 장도 한 번에 올릴 수 있어요.
            </span>
          </label>
        )
      ) : (
        <Field>
          <FieldLabel htmlFor="menu-url">식단표 링크</FieldLabel>
          <Input
            id="menu-url"
            type="url"
            inputMode="url"
            placeholder="https://"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="h-11"
          />
          <FieldDescription>어린이집 홈페이지·블로그 게시글이나 식단표 이미지 주소를 붙여 넣어 주세요.</FieldDescription>
        </Field>
      )}

      <Button size="lg" disabled={!canRead} onClick={read}>
        식단 읽어 오기
      </Button>
      <span className="text-center text-xs text-muted-foreground">사진은 메뉴를 읽는 데만 쓰고 바로 지워요.</span>
    </div>
  );
}

/** 고른 사진의 미리보기 주소. 사진이 바뀌거나 화면을 떠나면 지운다. */
function useObjectUrls(files: File[]): string[] {
  const [urls, setUrls] = useState<string[]>([]);
  const made = useRef<string[]>([]);
  useEffect(() => {
    const next = files.map((f) => URL.createObjectURL(f));
    made.current = next;
    // 외부 자원(object URL)을 만든 뒤 그 주소를 상태로 넘긴다.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUrls(next);
    return () => next.forEach((u) => URL.revokeObjectURL(u));
  }, [files]);
  return urls;
}
