import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";

export function BackLink({ href, children }: { href: string; children: string }) {
  return (
    <div>
      <Link href={href} className={buttonVariants({ variant: "ghost", size: "sm" })}>
        ← {children}
      </Link>
    </div>
  );
}
