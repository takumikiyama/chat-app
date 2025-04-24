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

// 名前からイニシャルを生成
function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w.charAt(0))
    .join("")
    .toUpperCase();
}

// 名前から背景色を決定する簡易ハッシュ
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

  // API からチャット一覧を取得し、日時をフォーマットして state にセット
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
        // 降順ソート
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
    // 初回取得
    fetchChats();

    // 新着メッセージをリアルタイムに受信して当該チャットを更新
    socket.on(
      "newMessage",
      (payload: {
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
          // 最新日時でソートし直す
          return updated.sort(
            (a, b) =>
              new Date(b.latestMessageAt).getTime() -
              new Date(a.latestMessageAt).getTime()
          );
        });
      }
    );

    // マッチング成立があれば新規チャットが追加され得るので再取得
    socket.on("matchEstablished", () => {
      fetchChats();
    });

    return () => {
      socket.off("newMessage");
      socket.off("matchEstablished");
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <div className="p-4 flex-1">
        <h1 className="text-2xl font-bold mb-3 text-center">Chat</h1>
        <ul className="space-y-2">
          {chats.map((chat) => (
            <li
              key={chat.chatId}
              onClick={() => router.push(`/chat/${chat.chatId}`)}
              className="relative p-3 cursor-pointer hover:bg-gray-100 transition rounded-lg"
            >
              <span className="absolute top-3 right-3 text-xs text-gray-400">
                {chat.latestMessageAt}
              </span>
              <div className="flex items-center gap-3">
                {/* 動的イニシャルアイコン */}
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
                  style={{ backgroundColor: getBgColor(chat.matchedUser.name) }}
                >
                  {getInitials(chat.matchedUser.name)}
                </div>
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg font-semibold">
                      {chat.matchedUser.name}
                    </span>
                    <span className="text-lg font-semibold">
                      「{chat.matchMessage}」
                    </span>
                  </div>
                  <div className="text-sm text-gray-500">
                    {chat.latestMessage}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <FixedTabBar />
    </div>
  );
}