"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import FixedTabBar from "../components/FixedTabBar";

// チャットリストアイテム型
interface ChatItem {
  chatId: string;
  matchedUser: { id: string; name: string };
  matchMessage: string;
  latestMessage: string;
  latestMessageAt: string;
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
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  const h = hash % 360;
  return `hsl(${h}, 70%, 80%)`;
}

export default function ChatList() {
  const router = useRouter();
  const [chats, setChats] = useState<ChatItem[]>([]);

  // チャット一覧取得
  useEffect(() => {
    const fetchChats = async () => {
      const userId = localStorage.getItem("userId");
      if (!userId) return;
      try {
        const res = await axios.get<ChatItem[]>('/api/chat-list', {
          headers: { userId }
        });
        // 日付フォーマット
        const formatted = res.data.map((c) => ({
          ...c,
          latestMessageAt: new Date(c.latestMessageAt).toLocaleString("ja-JP", {
            hour: '2-digit', minute: '2-digit', month: '2-digit', day: '2-digit'
          })
        }));
        setChats(formatted);
      } catch (e) {
        console.error('🚨 チャットリスト取得エラー:', e);
      }
    };
    fetchChats();
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
