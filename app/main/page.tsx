"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Image from "next/image";
import FixedTabBar from "../components/FixedTabBar";

interface User {
  id: string;
  name: string;
  bio: string;
}

const MESSAGES = [
  "happy",
  "😆",
  "ひゃああああ",
  "夏、海行きてえ",
  "研究いいかんじですか？",
  "出かけましょうか",
  "Let's grab a drink",
  "おい",
  "drive🚗",
  "生存確認",
  "研究焦ってきた",
  "いつもありがとう",
  "新学期始まるね",
  "スポーツしよう",
  "😀😁🚢✨",
  "Plan a party for us",
];

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

function getBgColorLight(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = hash % 360;
  return `hsl(${h}, 70%, 90%)`;  // L を 90% に
}


function getBgColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = hash % 360;
  return `hsl(${h}, 70%, 80%)`;
}

export default function Main() {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<string | null>(null);
  const [selectedRecipientIds, setSelectedRecipientIds] = useState<string[]>([]);
  const [isSent, setIsSent] = useState(false);
  const [matchCount, setMatchCount] = useState<number>(0);
  const [step, setStep] = useState<"select-message" | "select-recipients">("select-message");

  useEffect(() => {
    const uid = localStorage.getItem("userId");
    if (!uid) return;
    axios
      .get<{ count: number }>("/api/match-message/count", { headers: { userId: uid } })
      .then((res) => setMatchCount(res.data.count))
      .catch((e) => console.error("件数取得エラー:", e));
  }, []);

  useEffect(() => {
    setCurrentUserId(localStorage.getItem("userId"));
  }, []);

  useEffect(() => {
    axios
      .get<User[]>("/api/users")
      .then((res) => setUsers(res.data))
      .catch((e) => console.error("ユーザー取得エラー:", e));
  }, []);

  const handleSelectMessage = (msg: string) => {
    setSelectedMessage(prev => (prev === msg ? null : msg));
  };

  const toggleRecipient = (id: string) => {
    setSelectedRecipientIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSend = async () => {
    if (!selectedMessage || selectedRecipientIds.length === 0 || !currentUserId) {
      alert("メッセージと送信相手を選択してください。\u3002");
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
      setTimeout(() => {
        setIsSent(false);
        setSelectedMessage(null);
        setSelectedRecipientIds([]);
        setStep("select-message");
      }, 3000);
    } catch (error) {
      console.error("送信エラー:", error);
      alert("メッセージの送信に失敗しました");
    }
  };

  return (
    <div className="flex flex-col h-screen">
      {/* ヘッダー */}
      <div className="fixed top-0 left-0 w-full bg-white z-10 p-4 flex flex-col items-center">
        <div className="flex w-full justify-between items-center">
          <div />
          <h1 className="text-3xl font-bold text-black absolute left-1/2 transform -translate-x-1/2 mt-1" style={{ fontFamily: "'Poppins', sans-serif" }}>Glance</h1>
          <div className="w-24" />
        </div>
        <p className="text-sm text-gray-800 text-center leading-snug mt-7">
          お互いが同じメッセージを送り合ったら初めて届き、チャットが始まります。
          今日は <strong>{matchCount}</strong> 件受信済。
        </p>
      </div>

      {/* 送信待機バー */}
      <div
        className={`fixed top-24 left-3 right-3 flex px-4 py-2 z-20 shadow rounded-3xl
          ${selectedMessage && selectedRecipientIds.length > 0
            ? "bg-red-600"
            : "bg-gray-500"}`}
      >
        <div className="flex-1 pr-40 mr-10 flex items-center overflow-x-auto whitespace-nowrap scrollbar-hide">
          {selectedMessage ? (
            <span
              onClick={() => setSelectedMessage(null)}
              className="flex-none px-2 py-1 font-bold text-white whitespace-nowrap"
            >
              {selectedMessage}
            </span>
          ) : (
            <span className="px-2 py-1 text-gray-700">メッセージ</span>
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
                  {u?.name}
                  {idx < selectedRecipientIds.length - 1 ? ", " : ""}
                </span>
              );
            })
          ) : (
            <span className="px-2 py-1 text-gray-700">送信先</span>
          )}
        </div>

        {/* 送信ボタン */}
        <button
          onClick={() => {
            // 押した瞬間に短いバイブ
            navigator.vibrate?.(50);
            // 本処理
            handleSend();
          }}
          className="relative transition-transform duration-300 ease-out active:scale-200 focus:outline-none"
        >
          <Image
            src="/icons/send.png"
            alt="send"
            width={24}
            height={24}
            className="filter invert"
          />
        </button>
      </div>


      {/* コンテンツ */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="flex h-full transition-transform duration-450" style={{ transform: step === "select-message" ? "translateX(0%)" : "translateX(-100%)" }}>
          {/* メッセージ選択 */}
          <div className="min-w-full flex-1 text-lg overflow-y-auto px-5 pt-[160px] pb-[190px]">
            <div className="flex flex-col gap-2">
              {MESSAGES.map((msg) => (
                <button
                  key={msg}
                  onClick={() => handleSelectMessage(msg)}
                  className={`w-full text-left px-4 py-2 rounded-3xl transition-colors duration-100 ease-out shadow ${
                    selectedMessage === msg ? "font-bold text-black bg-gray-300" : "text-gray-700"
                  }`}
                >
                  {msg}
                </button>
              ))}
            </div>
          </div>

          {/* 送信先選択 */}
          <div className="min-w-full flex-1 text-lg overflow-y-auto px-5 pt-[160px] pb-[190px]">
            <div className="flex flex-col gap-2">
              {users.filter((u) => u.id !== currentUserId).map((u) => (
                <div
                  key={u.id}
                  onClick={() => toggleRecipient(u.id)}
                  className="flex items-center gap-3 p-2 rounded-3xl shadow"
                  style={{
                    backgroundColor: selectedRecipientIds.includes(u.id)
                      ? getBgColorLight(u.name)
                      : undefined,  //非選択時は透過
                  }}
                >
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold" style={{ backgroundColor: getBgColor(u.name) }}>
                    {getInitials(u.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-lg truncate ${selectedRecipientIds.includes(u.id) ? "font-bold text-black" : "text-gray-700"}`}>{u.name}</p>                </div>
                  {selectedRecipientIds.includes(u.id) && (
                    <Image src="/icons/check.png" alt="Selected" width={20} height={20} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </main> 

      {/* リスト選択エリア（下部固定） */}
      <div
        className="fixed bottom-[55px] left-[40px] right-[40px] z-20 bg-white py-1.5 px-3 rounded-3xl shadow"
      >
        <div className="relative flex">
          {/* スライドする背景 */}
          <span
            className="absolute top-0 bottom-0 w-1/2 bg-gray-200 rounded-3xl transition-transform duration-400"
            style={{
              transform:
                step === "select-message"
                  ? "translateX(0%)"
                  : "translateX(100%)",
            }}
          />
          {/* 左のボタン */}
          <button
            onClick={() => setStep("select-message")}
            className={`relative z-10 flex-1 py-2 text-center text-sm ${
              step === "select-message" ? "font-bold text-gray-600" : "font-bold text-gray-600"
            }`}
          >
            メッセージを選ぶ
          </button>
          {/* 右のボタン */}
          <button
            onClick={() => setStep("select-recipients")}
            className={`relative z-10 flex-1 py-2 text-center text-sm ${
              step === "select-recipients" ? "font-bold text-gray-600" : "font-bold text-gray-600"
            }`}
          >
            送信相手を選ぶ
          </button>
        </div>
      </div>


      {/* 送信成功メッセージ */}
      {isSent && (
        <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 text-white px-4 py-2 rounded-lg shadow-md animate-pulse">
          メッセージを送信しました！
        </div>
      )}

      {/* 下部タブバー */}
      <FixedTabBar />
    </div>
  );
}