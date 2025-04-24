"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import Image from "next/image";
import FixedTabBar from "../components/FixedTabBar";

interface User {
  id: string;
  name: string;
  bio: string;
}

const MESSAGES = [
  "うまい酒を飲みに行こう",
  "😆",
  "ひゃああああ",
  "花見行きてえ",
  "研究どう？",
  "みんなで集まろ", 
  "Let's grab a drink", 
  "おい", 
  "Let's go for a drive🚗", 
  "最近何してんねん",
  "研究焦ってきた", 
  "いつもありがとう", 
  "新学期始まるね", 
  "スポーツしよう", 
  "😀😁🚢✨"
];

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

function getBgColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  const h = hash % 360;
  return `hsl(${h}, 70%, 80%)`;
}

export default function Main() {
  const router = useRouter();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [matchCount, setMatchCount] = useState(0);
  const [selectedMessage, setSelectedMessage] = useState<string | null>(null);
  const [selectedRecipientIds, setSelectedRecipientIds] = useState<string[]>([]);
  const [isSent, setIsSent] = useState(false);

  useEffect(() => {
    setCurrentUserId(localStorage.getItem("userId"));
  }, []);

  // ユーザー一覧の取得
  useEffect(() => {
    axios
      .get<User[]>("/api/users")
      .then((res) => setUsers(res.data))
      .catch((e) => console.error("ユーザー取得エラー:", e));
  }, []);

  // 受信マッチメッセージ件数の取得
  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (!userId) return;
    axios
      .get<{ count: number }>("/api/match-message/count", {
        headers: { userId },
      })
      .then((res) => setMatchCount(res.data.count))
      .catch((e) => console.error("件数取得エラー:", e));
  }, []);

  const handleSend = async () => {
    if (!selectedMessage || selectedRecipientIds.length === 0 || !currentUserId) {
      alert("メッセージと送信相手を選択してください。");
      return;
    }

    try {
      await axios.post("/api/match-message", {
        senderId: currentUserId,
        receiverIds: selectedRecipientIds,
        message: selectedMessage,
      });

      if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
      setIsSent(true);
      setTimeout(() => setIsSent(false), 3000);
      setSelectedMessage(null);
      setSelectedRecipientIds([]);
      // 送信後に再取得（自分宛件数が減るケースがあるなら）
      axios
        .get<{ count: number }>("/api/match-message/count", {
          headers: { userId: currentUserId },
        })
        .then((res) => setMatchCount(res.data.count))
        .catch(() => {});
    } catch (error) {
      console.error("送信エラー:", error);
      alert("メッセージの送信に失敗しました");
    }
  };

  const toggleRecipient = (id: string) => {
    setSelectedRecipientIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  return (
    <div className="flex flex-col h-screen bg-white overflow-hidden">
      {/* 固定ヘッダー */}
      <div className="fixed top-0 left-0 w-full bg-white z-10 p-4">
        <div className="flex justify-between items-center">
          <button onClick={() => router.push("/notifications")}>
            <Image src="/icons/history.png" alt="History" width={24} height={24} />
          </button>
          <h1 className="text-3xl font-bold" style={{ fontFamily: "'Poppins', sans-serif" }}>
            Glance
          </h1>
          <div className="w-6" />
        </div>
        <p className="text-sm text-gray-600 text-center leading-snug mt-2">
          A chat begins when you both send the same message.
        </p>
        {/* ← 受信マッチメッセージ件数 */}
        <p className="text-sm text-gray-500 text-center mt-1">
          You have received <span className="font-semibold">{matchCount}</span> messages so far
        </p>
      </div>

      {/* 送信待機バー */}
      <div className="fixed top-[115px] left-1/2 transform -translate-x-1/2 bg-white/30 backdrop-blur-md rounded-full shadow-xl flex w-[95%] max-w-[600px] px-5 py-2 z-10">
        <div className="flex-1 pr-32 flex items-center gap-2 overflow-x-auto whitespace-nowrap scrollbar-hide">
          {selectedMessage ? (
            <span
              onClick={() => setSelectedMessage(null)}
              className="flex-none truncate max-w-[120px] px-2 py-1 bg-black text-white rounded-full font-medium"
            >
              {selectedMessage}
            </span>
          ) : (
            <span className="flex-none px-2 py-1 text-gray-500">メッセージ未選択</span>
          )}
          {selectedRecipientIds.length > 0 ? (
            selectedRecipientIds.map((id) => {
              const u = users.find((u) => u.id === id);
              return (
                <span key={id} className="flex-none px-1 py-1 text-black font-semibold">
                  {u?.name}
                </span>
              );
            })
          ) : (
            <span className="flex-none px-2 py-1 text-gray-500">送信先未選択</span>
          )}
        </div>
        <button
          onClick={handleSend}
          className="absolute right-5 top-1/2 transform -translate-y-1/2"
        >
          <Image src="/icons/send.png" alt="send" width={24} height={24} />
        </button>
      </div>

      {/* 本文：2カラム */}
      <div className="mt-[165px] flex flex-1 overflow-hidden">
        {/* メッセージ選択 */}
        <div className="w-2/5 overflow-y-auto p-4 space-y-2 pb-24">
          {MESSAGES.map((msg) => (
            <button
              key={msg}
              onClick={() => setSelectedMessage((prev) => (prev === msg ? null : msg))}
              className={`w-full px-4 py-3 rounded-[35px] transition transform ${
                selectedMessage === msg
                  ? "bg-black text-white scale-105 shadow-lg"
                  : "bg-gradient-to-r from-gray-200 to-gray-100 text-gray-800 hover:from-gray-300 hover:to-gray-200"
              }`}
            >
              {msg}
            </button>
          ))}
        </div>

        {/* 送信先リスト */}
        <div className="w-3/5 overflow-y-auto p-4 space-y-2 pb-24">
          {users
            .filter((u) => u.id !== currentUserId)
            .map((u) => (
              <div
                key={u.id}
                onClick={() => toggleRecipient(u.id)}
                className="flex items-center gap-3 p-2 rounded-lg cursor-pointer transition hover:bg-gray-100"
              >
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
                  style={{ backgroundColor: getBgColor(u.name) }}
                >
                  {getInitials(u.name)}
                </div>
                <div className="flex-1">
                  <span
                    className={`text-lg ${selectedRecipientIds.includes(u.id) ? "font-bold" : ""}`}
                  >
                    {u.name}
                  </span>
                  {/* ← bio を小さくグレーで表示 */}
                  <p className="text-sm text-gray-500 truncate">{u.bio || "自己紹介未設定"}</p>
                </div>
                {selectedRecipientIds.includes(u.id) && (
                  <Image src="/icons/check.png" alt="Selected" width={20} height={20} />
                )}
              </div>
            ))}
        </div>
      </div>

      {/* 下部タブバー */}
      <FixedTabBar />

      {/* 送信成功メッセージ */}
      {isSent && (
        <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 text-white px-4 py-2 rounded-lg shadow-md animate-pulse">
          Message sent!
        </div>
      )}
    </div>
  );
}
