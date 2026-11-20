import { redirect } from "next/navigation";

/** 설정은 "우리 아이" 탭으로 옮겼다. 예전 주소로 들어와도 그쪽으로 보낸다. */
export default function SettingsPage() {
  redirect("/kid");
}
