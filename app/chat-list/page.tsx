"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

type ChatItem = {
  chatId: string;
  matchedUser: {
    id: string;
    name: string;
  };
  matchMessage: string; // ✅ MatchPairのメッセージ
  latestMessage: string; // ✅ 最新のメッセージ
  latestMessageAt: string; // ✅ 最新のメッセージの送信日時
  formattedLatestMessageAt?: string; // ✅ フォーマット済みの日付
};

export default function ChatList() {
  const router = useRouter();
  const [chats, setChats] = useState<ChatItem[]>([]);

  useEffect(() => {
    const fetchChats = async () => {
      try {
        const userId = localStorage.getItem("userId");
        if (!userId) {
          console.error("🚨 ユーザーIDが取得できません！");
          return;
        }

        const response = await axios.get("/api/chat-list", {
          headers: { userId }, // ✅ ヘッダーに userId を追加
        });

        const formattedChats = response.data.map((chat: ChatItem) => ({
          ...chat,
          formattedLatestMessageAt: new Date(chat.latestMessageAt).toLocaleString("ja-JP", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          }),
        }));

        setChats(formattedChats);
      } catch (error) {
        console.error("🚨 チャットリスト取得エラー:", error);
      }
    };

    fetchChats();
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h1>チャットリスト</h1>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {chats.map((chat) => (
          <li
            key={chat.chatId}
            onClick={() => router.push(`/chat/${chat.chatId}`)}
            style={{
              border: "1px solid #ccc",
              borderRadius: "8px",
              padding: "10px",
              marginBottom: "10px",
              cursor: "pointer",
              transition: "background 0.2s",
            }}
          >
            <div style={{ fontSize: "16px", fontWeight: "bold" }}>
              {chat.matchedUser.name}  <span style={{ fontSize: "14px", color: "#666" }}>「{chat.matchMessage}」</span>
            </div>
            <div style={{ fontSize: "14px", color: "#444", marginTop: "5px" }}>
              {chat.latestMessage}
              <span style={{ fontSize: "12px", color: "#999", marginLeft: "10px" }}>
                {chat.formattedLatestMessageAt}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}