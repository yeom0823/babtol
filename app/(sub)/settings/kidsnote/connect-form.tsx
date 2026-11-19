"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Spinner } from "@/components/ui/spinner";

import { connect, submitCode, type ConnectState } from "./actions";

const START: ConnectState = { step: "login", failed: false };

export function ConnectForm() {
  const [loginState, loginAction, loginPending] = useActionState(connect, START);
  const [codeState, codeAction, codePending] = useActionState(submitCode, START);
  const [restart, setRestart] = useState(false);

  // 로그인 결과가 코드 입력이면 코드 화면을 보여 준다.
  const needsCode = loginState.step === "code" && !restart;
  const phone = loginState.step === "code" ? loginState.phone : "";
  const codeFailed = codeState.step === "code" && codeState.failed;

  return (
    <>
      {needsCode ? (
        <Card>
          <CardContent>
            <form action={codeAction} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <h2 className="text-[17px] font-bold">인증 코드를 입력해 주세요</h2>
                <p className="m-0 text-[13px] text-muted-foreground">
                  키즈노트 계정에 2단계 인증이 켜져 있어요. {phone ? `${phone}로 보낸 ` : ""}6자리 코드를 입력해 주세요.
                </p>
              </div>
              {codeFailed && (
                <Alert variant="destructive" role="alert">
                  <AlertTitle>코드가 맞지 않아요</AlertTitle>
                  <AlertDescription>숫자 6자리를 다시 확인해 주세요.</AlertDescription>
                </Alert>
              )}
              <div className="flex justify-center">
                <InputOTP maxLength={6} name="code" inputMode="numeric" aria-label="인증 코드 6자리">
                  <InputOTPGroup>
                    {[0, 1, 2, 3, 4, 5].map((i) => (
                      <InputOTPSlot key={i} index={i} />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
              </div>
              <Button type="submit" size="lg" disabled={codePending}>
                {codePending && <Spinner data-icon="inline-start" />}확인
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => setRestart(true)}>
                처음으로
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent>
            <form
              action={(formData) => {
                setRestart(false);
                loginAction(formData);
              }}
              className="flex flex-col gap-3"
            >
              {loginState.step === "login" && loginState.failed && (
                <Alert variant="destructive" role="alert">
                  <AlertTitle>로그인하지 못했어요</AlertTitle>
                  <AlertDescription>
                    아이디나 비밀번호가 키즈노트와 달라요. 키즈노트 앱에서 쓰는 그대로 입력해 주세요.
                  </AlertDescription>
                </Alert>
              )}
              <Field>
                <FieldLabel htmlFor="kn-id">키즈노트 아이디</FieldLabel>
                <Input id="kn-id" name="username" autoComplete="username" required />
              </Field>
              <Field>
                <FieldLabel htmlFor="kn-pw">비밀번호</FieldLabel>
                <Input id="kn-pw" name="password" type="password" autoComplete="current-password" required />
                <FieldDescription>비밀번호는 로그인할 때 한 번만 쓰고 저장하지 않아요.</FieldDescription>
              </Field>
              <Button type="submit" size="lg" disabled={loginPending}>
                {loginPending && <Spinner data-icon="inline-start" />}
                {loginPending ? "연결하는 중" : "연결하기"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Card className="bg-muted ring-0">
        <CardContent className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <h3 className="text-[15px] font-bold">키즈노트를 안 쓰거나 연결하기 싫다면</h3>
            <p className="m-0 text-[13px] text-muted-foreground">
              어린이집에서 받은 식단표 사진이나 링크를 올려도 돼요.
            </p>
          </div>
          <Link href="/upload" className={buttonVariants({ variant: "outline" })}>
            📷 식단표 올리기
          </Link>
        </CardContent>
      </Card>
    </>
  );
}
