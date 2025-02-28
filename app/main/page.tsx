"use client";
import { useState, useEffect } from "react";
import axios from "axios";

interface User {
  id: string;
  name: string;
}

export default function Main() {
  const [selectedMessage, setSelectedMessage] = useState<string | null>(null);
  const [receiverIds, setReceiverIds] = useState<string[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // ログインユーザーのIDを取得
  useEffect(() => {
    const userId = localStorage.getItem("userId");
    setCurrentUserId(userId);
  }, []);

  // 登録ユーザー一覧を取得
  useEffect(() => {
    axios.get("/api/users")
      .then((res) => setUsers(res.data))
      .catch((error) => console.error("Error fetching users:", error));
  }, []);

  const sendMatchMessage = async () => {
    if (!selectedMessage || receiverIds.length === 0) {
      alert("メッセージと送信相手を選択してください。");
      return;
    }

    const senderId = localStorage.getItem("userId");

    if (!senderId) {
      alert("ログインしてください");
      return;
    }

    console.log("🔹 送信データ:", { senderId, receiverIds, message: selectedMessage });

    try {
      const response = await axios.post("/api/match-message", {
        senderId: senderId,
        receiverIds: receiverIds,
        message: selectedMessage,
      });
      console.log("レスポンス：", response.data);
      alert("メッセージを送信しました！");
    } catch (error) {
      console.error("faild send message!", error);
      alert("メッセージの送信に失敗しました");
    }
  };

  return (
    <div className="p-5">
      <h1 className="text-2xl mb-4">マッチメッセージを送信</h1>

      {/* マッチメッセージ選択（ボタン式） */}
      <div className="mb-4">
        <h2 className="text-lg mb-2">マッチメッセージを選択</h2>
        <div className="flex gap-2 flex-wrap">
          {["こんにちは！", "趣味は何ですか？", "一緒に遊びませんか？", "映画好きですか？"].map((msg) => (
            <button
              key={msg}
              onClick={() => setSelectedMessage(msg)}
              className={`px-4 py-2 rounded-lg border ${
                selectedMessage === msg ? "bg-blue-500 text-white" : "bg-gray-200"
              }`}
            >
              {msg}
            </button>
          ))}
        </div>
      </div>

      {/* 送信相手の選択（自分自身を除外） */}
      <div className="mb-4">
        <h2 className="text-lg mb-2">送信相手を選択</h2>
        <div className="flex gap-2 flex-wrap">
          {users
            .filter((user) => user.id !== currentUserId) // ✅ 自分をリストから除外
            .map((user) => (
              <button
                key={user.id}
                onClick={() =>
                  setReceiverIds((prev) =>
                    prev.includes(user.id)
                      ? prev.filter((id) => id !== user.id) // クリックで選択解除
                      : [...prev, user.id] // クリックで追加
                  )
                }
                className={`px-4 py-2 rounded-lg border ${
                  receiverIds.includes(user.id) ? "bg-green-500 text-white" : "bg-gray-200"
                }`}
              >
                {user.name}
              </button>
            ))}
        </div>
      </div>

      {/* 送信ボタン */}
      <button
        onClick={sendMatchMessage}
        className="px-6 py-3 bg-blue-500 text-white rounded-lg w-full"
      >
        送信
      </button>
    </div>
  );
}
