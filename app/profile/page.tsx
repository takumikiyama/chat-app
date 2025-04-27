"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import FixedTabBar from "../components/FixedTabBar";
import { unsubscribePush } from "@/app/lib/push";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w.charAt(0))
    .join("")
    .toUpperCase();
}

function getBgColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  const h = hash % 360;
  return `hsl(${h}, 70%, 60%)`;
}

interface User {
  name: string;
  email: string;
  bio: string;
}

export default function Profile() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [showSavedPopup, setShowSavedPopup] = useState(false);
  const [showLogoutPopup, setShowLogoutPopup] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }
      try {
        const res = await axios.get("/api/auth/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(res.data);
        setName(res.data.name);
        setBio(res.data.bio || "");
      } catch {
        // 期限切れ or 無効トークンならクリアしてログイン画面へ
        localStorage.removeItem("token");
        localStorage.removeItem("userId");
        router.push("/login");
      }
    };
    fetchUser();
  }, [router]);

  const handleUpdateProfile = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("ログインしてください");
      return;
    }
    try {
      const res = await axios.put(
        "/api/auth/profile",
        { name, bio },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUser(res.data);
      setIsEditing(false);
      setShowSavedPopup(true);
      setTimeout(() => setShowSavedPopup(false), 3000);
    } catch {
      alert("プロフィールの更新に失敗しました");
    }
  };

  const handleLogout = async () => {
    try {
          // プッシュ購読解除
          await unsubscribePush();
    } catch (e) {
          console.error("プッシュ解除エラー:", e);
    }
    // ローカルストレージ・リダイレクト
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    router.push("/login");
  };

  if (!user) return <p className="p-5">Loading...</p>;

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <div className="flex-1 overflow-y-auto p-5 pb-20 max-w-md mx-auto">
        <h2 className="text-2xl font-bold text-center mb-4">Profile</h2>
        {showSavedPopup && (
          <div className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-black text-white px-4 py-2 rounded-full z-50">
            変更を保存しました
          </div>
        )}
        <div className="flex justify-center mb-4">
          <div
            className="w-32 h-32 rounded-full flex items-center justify-center text-white text-4xl font-bold"
            style={{ backgroundColor: getBgColor(user.name) }}
          >
            {getInitials(user.name)}
          </div>
        </div>

        {isEditing ? (
          <div className="space-y-4">
            <div>
              <label className="block mb-1 font-semibold">名前</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="border p-2 w-full rounded-lg"
              />
            </div>
            <div>
              <label className="block mb-1 font-semibold">自己紹介</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="border p-2 w-full h-24 rounded-lg"
              />
            </div>
            <div className="flex justify-center gap-4">
              <button
                onClick={handleUpdateProfile}
                className="bg-blue-500 text-white px-6 py-2 rounded-full hover:bg-blue-600"
              >
                保存
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="bg-gray-500 text-white px-6 py-2 rounded-full hover:bg-gray-600"
              >
                キャンセル
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-4">
            <h2 className="text-xl font-semibold">{user.name}</h2>
            <p className="text-gray-600">{user.email}</p>
            <p className="text-gray-700">{user.bio || "自己紹介未設定"}</p>
            <button
              onClick={() => setIsEditing(true)}
              className="bg-black text-white px-6 py-2 rounded-full hover:bg-gray-800"
            >
              編集
            </button>
            <button
              onClick={() => setShowLogoutPopup(true)}
              className="bg-red-500 text-white px-6 py-2 rounded-full hover:bg-red-600"
            >
              ログアウト
            </button>
          </div>
        )}

        {showLogoutPopup && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
            <div className="bg-white p-5 rounded-xl shadow-lg w-11/12 max-w-sm">
              <h3 className="text-lg font-bold mb-2">ログアウト確認</h3>
              <p className="mb-4">本当にログアウトしますか？</p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={handleLogout}
                  className="bg-red-500 text-white px-6 py-2 rounded-full hover:bg-red-600"
                >
                  ログアウト
                </button>
                <button
                  onClick={() => setShowLogoutPopup(false)}
                  className="bg-gray-500 text-white px-6 py-2 rounded-full hover:bg-gray-600"
                >
                  キャンセル
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      <FixedTabBar />
    </div>
  );
}
