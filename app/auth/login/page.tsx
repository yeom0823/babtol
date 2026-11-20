import { BackLink } from "@/components/back-link";
import { LoginForm } from "@/features/account";

export default function LoginPage() {
  return (
    <div className="flex flex-1 flex-col gap-4 py-4">
      <BackLink href="/kid">우리 아이</BackLink>
      <LoginForm />
    </div>
  );
}
