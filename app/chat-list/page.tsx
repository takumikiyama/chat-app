"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { useChatData } from "@/app/contexts/ChatDataContext";
import FixedTabBar from "../components/FixedTabBar";

// チャットリストアイテムの型定義
export interface ChatItem {
  chatId: string;
  matchedUser: { id: string; name: string };
  matchMessage: string;
  latestMessage: string;
  latestMessageAt: string; // フォーマット済み日時
}

// ユーザー名からイニシャル生成
function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w.charAt(0))
    .join("")
    .toUpperCase();
}

// ユーザー名から背景色ハッシュ
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
  const { chatList, setChatList } = useChatData();

  // キャッシュがあれば初期値に、なければ空配列
  const [chats, setChats] = useState<ChatItem[]>(chatList || []);
  const [isLoading, setIsLoading] = useState(false);

  // チャット一覧取得＆キャッシュ更新
  const fetchChats = async () => {
    const userId = localStorage.getItem("userId");
    if (!userId) return;
    setIsLoading(true);
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
      setChatList(formatted);
    } catch (e) {
      console.error("🚨 チャットリスト取得エラー:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // キャッシュがあれば即表示、その後更新
    fetchChats();
  }, []);

  return (
    <div className="flex flex-col h-[100dvh] bg-white overflow-hidden">
      {/* 固定ヘッダー */}
      <div className="shrink-0 bg-white z-10 p-4 border-b">
        <h1 className="text-2xl font-bold text-center">Chat</h1>
      </div>

      {/* スクロール可能リスト */}
      <div className="flex-1 overflow-y-auto px-3 py-4">
        {isLoading && chats.length === 0 ? (
          <p className="text-center text-gray-500">読み込み中…</p>
        ) : chats.length === 0 ? (
          <p className="text-center text-gray-500">まだチャットがありません</p>
        ) : (
          <ul className="space-y-2 pb-20">
            {chats.map((chat) => (
              <li
                key={chat.chatId}
                onClick={() => router.push(`/chat/${chat.chatId}`)}
                className="relative p-3 cursor-pointer border rounded-lg flex items-center gap-3 transition-transform duration-200 ease-out active:scale-95"
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
                  <p className="text-sm text-gray-700 truncate">
                    「{chat.matchMessage}」
                  </p>
                  <p className="text-sm text-gray-500 truncate">
                    {chat.latestMessage}
                  </p>
                </div>

                {/* タイムスタンプ */}
                <span className="absolute top-3 right-3 text-xs text-gray-400">
                  {chat.latestMessageAt}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* 下部タブバー */}
      <div className="shrink-0">
        <FixedTabBar />
      </div>
    </div>
  );
}
