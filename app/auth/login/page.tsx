import { LoginForm } from "@/features/account";

export default function LoginPage() {
  return (
    <div className="flex flex-1 flex-col justify-center gap-4 py-8">
      <div className="flex flex-col items-center gap-1 text-center">
        <span className="font-cute text-4xl text-primary">밥톨</span>
        <p className="m-0 text-[13px] text-muted-foreground">어린이집 식단에 맞춘 우리 아이 집밥</p>
      </div>
      <LoginForm />
    </div>
  );
}
