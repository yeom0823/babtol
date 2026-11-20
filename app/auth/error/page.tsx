import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AuthErrorPage() {
  return (
    <div className="flex flex-1 flex-col gap-4 py-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">로그인하지 못했어요</CardTitle>
          <CardDescription>Google 로그인 중에 문제가 생겼어요. 잠시 뒤에 다시 시도해 주세요.</CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/auth/login" className={buttonVariants()}>
            다시 로그인하기
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
