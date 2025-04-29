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
  "😀😁🚢✨",
  "Plan a party for us"
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
  const [matchCount, setMatchCount] = useState<number>(0);
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

  // 受信マッチ件数の取得
  useEffect(() => {
    const uid = localStorage.getItem("userId");
    if (!uid) return;
    axios
      .get<{ count: number }>("/api/match-message/count", {
        headers: { userId: uid },
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

      // 再取得
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
    <div className="relative h-screen">
      {/* 固定ヘッダー */}
      <div className="fixed top-0 left-0 w-full bg-white z-10 p-4">
        <div className="flex justify-between items-center">
          <button onClick={() => router.push("/notifications")}> 
            <Image src="/icons/history.png" alt="History" width={24} height={24} className="filter invert" />
          </button>
          <h1 className="text-3xl font-bold text-black" style={{ fontFamily: "'Poppins', sans-serif" }}>
            Glance
          </h1>
          <div className="w-6" />
        </div>
        <p className="text-sm text-gray-800 text-center leading-snug mt-2">
          お互いが同じメッセージを送り合ったら初めて届き、チャットが始まります。
          今日は <strong>{matchCount}</strong> 件受信済。
        </p>
      </div>

      {/* 送信待機バー */}
      {(selectedMessage || selectedRecipientIds.length > 0) && (
        <div className="fixed bottom-12 left-0 right-0 bg-black flex w-full px-4 py-3 z-20">
          <div className="flex-1 pr-40 mr-10 flex items-center overflow-x-auto whitespace-nowrap scrollbar-hide">
            {selectedMessage ? (
              <span
                onClick={() => setSelectedMessage(null)}
                className="truncate max-w-[120px] px-2 py-1 font-bold text-white"
              >
                {selectedMessage}
              </span>
            ) : (
              <span className="px-2 py-1 text-gray-400">メッセージ</span>
            )}
            {selectedRecipientIds.length > 0 ? (
              selectedRecipientIds.map((id, idx) => {
                const u = users.find((u) => u.id === id);
                return (
                  <span
                    key={id}
                    onClick={() => toggleRecipient(id)}
                    className="px-1 py-1 text-white font-semibold whitespace-nowrap"
                  >
                    {u?.name}{idx < selectedRecipientIds.length-1 ? ', ' : ''}
                  </span>
                );
              })
            ) : (
              <span className="px-2 py-1 text-gray-400">送信先</span>
            )}
          </div>
          <button
            onClick={handleSend}
            className="absolute right-5 top-1/2 transform -translate-y-1/2 transition-transform duration-150 ease-out active:scale-90 active:opacity-80 focus:outline-none"
          >
            <Image src="/icons/send.png" alt="send" width={24} height={24} className="filter invert" />
          </button>
        </div>
      )}

      {/* 本文：2カラム */}
      <div className="absolute top-[110px] bottom-[80px] left-0 right-0 flex gap-4 px-4 py-2">
        {/* メッセージ選択 */}
        <div className="flex-1 overflow-y-auto space-y-2">
          {MESSAGES.map((msg) => (
            <button
              key={msg}
              onClick={() => setSelectedMessage((prev) => (prev === msg ? null : msg))}
              className={`w-full text-left px-2 py-2 text-[18px] transition ${
                selectedMessage === msg
                  ? "font-bold text-black"
                  : "text-gray-700 hover:text-black"
              }`}
            >
              {msg}
            </button>
          ))}
        </div>

        {/* 送信先リスト */}
        <div className="flex-1 overflow-y-auto space-y-1 pb-28">
          {users
            .filter((u) => u.id !== currentUserId)
            .map((u) => (
              <div
                key={u.id}
                onClick={() => toggleRecipient(u.id)}
                className="flex items-center gap-2 p-2 rounded-lg cursor-pointer transition hover:bg-gray-100"
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                  style={{ backgroundColor: getBgColor(u.name) }}
                >
                  {getInitials(u.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-[18px] text-black truncate ${selectedRecipientIds.includes(u.id) ? "font-bold" : ""}`}>
                    {u.name}
                  </p>
                  <p className="text-sm text-gray-500 truncate">
                    {u.bio || "自己紹介未設定"}
                  </p>
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
