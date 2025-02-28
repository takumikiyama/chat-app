"use client";

import { useState, useEffect } from "react";
import axios from "axios";

interface User {
  name: string;
  email: string;
  bio: string;
}

export default function Profile() {
  const [user, setUser] = useState<User | null>(null);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("🚨 未ログイン");
        return;
      }

      try {
        const res = await axios.get("/api/auth/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(res.data);
        setName(res.data.name);
        setBio(res.data.bio || "");
      } catch (error) {
        console.error("🚨 プロフィール取得エラー:", error);
      }
    };

    fetchUser();
  }, []);

  const handleUpdateProfile = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("ログインしてください");
      return;
    }

    try {
      const res = await axios.put("/api/auth/profile", { name, bio }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setUser(res.data);
      setIsEditing(false);
      alert("プロフィールを更新しました！");
    } catch (error) {
      console.error("🚨 プロフィール更新エラー:", error);
      alert("プロフィールの更新に失敗しました");
    }
  };

  if (!user) return <p>Loading...</p>;

  return (
    <div className="p-5">
      <h1 className="text-2xl mb-4">プロフィール</h1>

      {isEditing ? (
        <div>
          <label className="block mb-2">
            <span className="font-semibold">名前:</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="border p-2 w-full"
            />
          </label>
          
          <label className="block mb-2">
            <span className="font-semibold">自己紹介:</span>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="border p-2 w-full h-20"
            />
          </label>

          <button
            onClick={handleUpdateProfile}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg mr-2"
          >
            保存
          </button>
          <button
            onClick={() => setIsEditing(false)}
            className="bg-gray-500 text-white px-4 py-2 rounded-lg"
          >
            キャンセル
          </button>
        </div>
      ) : (
        <div>
          <p><strong>名前:</strong> {user.name}</p>
          <p><strong>メール:</strong> {user.email}</p>
          <p><strong>自己紹介:</strong> {user.bio || "未設定"}</p>

          <button
            onClick={() => setIsEditing(true)}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg mt-4"
          >
            編集
          </button>
        </div>
      )}
    </div>
  );
}
