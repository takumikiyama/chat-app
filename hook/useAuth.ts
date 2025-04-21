// hook/useAuth.ts
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

interface User {
  name: string;
  email: string;
  bio?: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("token");

      // トークンがなければログイン画面へ
      if (!token) {
        router.push("/login");
        return;
      }

      try {
        const res = await axios.get("/api/auth/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(res.data);
      } catch (err: unknown) {
        console.error("Authentication failed:", err);

        // トークン無効 or 期限切れならクリアしてログインへ
        localStorage.removeItem("token");
        localStorage.removeItem("userId");
        router.push("/login");
      }
    };

    fetchUser();
  }, [router]);

  return user;
}
