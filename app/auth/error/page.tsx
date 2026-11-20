import Link from "next/link";

import { BrandHero } from "@/components/brand-hero";
import { buttonVariants } from "@/components/ui/button";

export default function AuthErrorPage() {
  return (
    <div className="flex flex-1 flex-col justify-center gap-6 py-8">
      <BrandHero title="로그인하지 못했어요" description="Google 로그인 중에 문제가 생겼어요. 잠시 뒤에 다시 시도해 주세요." />
      <Link href="/auth/login" className={`${buttonVariants({ size: "lg" })} h-11 w-full rounded-full text-[15px]`}>
        다시 로그인하기
      </Link>
    </div>
  );
}
