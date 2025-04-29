// app/chat-list/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import socket from "@/app/socket";
import FixedTabBar from "../components/FixedTabBar";

// チャットリストアイテム型
interface ChatItem {
  chatId: string;
  matchedUser: { id: string; name: string };
  matchMessage: string;
  latestMessage: string;
  latestMessageAt: string; // フォーマット済み日時文字列
}

// イニシャル生成
function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w.charAt(0))
    .join("")
    .toUpperCase();
}

// 背景色ハッシュ
function getBgColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = hash % 360;
  return `hsl(${h}, 70%, 80%)`;
}

export default function ChatList() {
  const router = useRouter();
  const [chats, setChats] = useState<ChatItem[]>([]);

  // API からチャット一覧を取得
  const fetchChats = async () => {
    const userId = localStorage.getItem("userId");
    if (!userId) return;
    try {
      const res = await axios.get<ChatItem[]>("/api/chat-list", {
        headers: { userId },
      });
      const formatted = res.data
        .map((c) => ({
          ...c,
          latestMessageAt: new Date(c.latestMessageAt).toLocaleString("ja-JP", {
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          }),
        }))
        .sort(
          (a, b) =>
            new Date(b.latestMessageAt).getTime() -
            new Date(a.latestMessageAt).getTime()
        );
      setChats(formatted);
    } catch (e) {
      console.error("🚨 チャットリスト取得エラー:", e);
    }
  };

  useEffect(() => {
    fetchChats();

    const handleNewMessage = (payload: {
      chatId: string;
      message: { content: string; createdAt: string; sender: { name: string } };
    }) => {
      setChats((prev) => {
        const updated = prev.map((chat) =>
          chat.chatId === payload.chatId
            ? {
                ...chat,
                latestMessage: payload.message.content,
                latestMessageAt: new Date(
                  payload.message.createdAt
                ).toLocaleString("ja-JP", {
                  month: "2-digit",
                  day: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                }),
              }
            : chat
        );
        return updated.sort(
          (a, b) =>
            new Date(b.latestMessageAt).getTime() -
            new Date(a.latestMessageAt).getTime()
        );
      });
    };
    socket.on("newMessage", handleNewMessage);

    const handleNewMatch = () => {
      fetchChats();
    };
    socket.on("newMatch", handleNewMatch);

    return () => {
      socket.off("newMessage", handleNewMessage);
      socket.off("newMatch", handleNewMatch);
    };
  }, []);

  return (
    <div className="relative min-h-screen flex flex-col bg-white">
      {/* ヘッダー */}
      <div className="fixed top-0 left-0 right-0 bg-white z-10 p-4">
        <h1 className="text-2xl font-bold text-center">Chat</h1>
      </div>

      {/* チャット一覧スクロール領域 */}
      <div className="absolute top-16 bottom-14 left-0 right-0 overflow-y-auto p-3">
        <ul className="space-y-0">
          {chats.map((chat) => (
            <li
              key={chat.chatId}
              onClick={() => router.push(`/chat/${chat.chatId}`)}
              className="relative p-3 cursor-pointer rounded-lg flex items-center gap-3"
            >
              {/* アイコン */}
              <div
                className="shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
                style={{ backgroundColor: getBgColor(chat.matchedUser.name) }}
              >
                {getInitials(chat.matchedUser.name)}
              </div>

              {/* 本文 */}
              <div className="flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-base font-semibold text-black">
                    {chat.matchedUser.name}
                  </span>
                </div>
                <div className="text-sm text-gray-700 truncate">
                  「{chat.matchMessage}」
                </div>
                <div className="text-sm text-gray-500 truncate">
                  {chat.latestMessage}
                </div>
              </div>

              {/* タイムスタンプ */}
              <span className="absolute bottom-3 right-3 text-xs text-gray-400">
                {chat.latestMessageAt}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* 下部タブバー */}
      <FixedTabBar />
    </div>
  );
}