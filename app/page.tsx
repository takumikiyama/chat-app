// app/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // トークン or userId を見て認証判定
    const token = localStorage.getItem("token");
    if (token) {
      router.replace("/main");   // ログイン済み → メイン画面へ
    } else {
      router.replace("/login");  // 未ログイン → ログイン画面へ
    }
  }, [router]);

  // リダイレクトが走るまでアイコンだけ表示
  return (
    <div className="flex items-center justify-center h-screen bg-white">
      <Image
        src="/app_icon.PNG"
        alt="App Icon"
        width={120}
        height={120}
        priority
      />
    </div>
  );
}