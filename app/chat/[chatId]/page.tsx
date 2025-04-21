"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import socket from "@/app/socket";
import Image from "next/image";

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
  return `hsl(${h}, 70%, 90%)`;
}

type Message = {
  id: string;
  sender: { id: string; name: string };
  content: string;
  createdAt: string;
  formattedDate?: string;
};

export default function Chat() {
  const router = useRouter();
  const { chatId } = useParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // ログインユーザーIDを取得
  useEffect(() => {
    setCurrentUserId(localStorage.getItem("userId"));
  }, []);

  // 初期メッセージ取得＋ソケット各種イベント登録
  useEffect(() => {
    if (!chatId) return;

    // 1) REST で過去メッセージを取得
    const fetchMessages = async () => {
      try {
        const res = await axios.get(`/api/chat/${chatId}`);
        const fetched: Message[] = res.data.map((msg: Message) => ({
          ...msg,
          formattedDate: new Date(msg.createdAt).toLocaleString("ja-JP", {
            hour: "2-digit",
            minute: "2-digit",
            month: "2-digit",
            day: "2-digit",
          }),
        }));
        setMessages(fetched);
      } catch (e) {
        console.error("🚨 メッセージ取得エラー:", e);
      }
    };
    fetchMessages();

    // 2) Notification の権限を要求
    if ("Notification" in window && Notification.permission !== "granted") {
      Notification.requestPermission();
    }

    // 3) ソケットで新着メッセージを受信
    socket.on("receiveMessage", (message: Message) => {
      const formatted: Message = {
        ...message,
        formattedDate: new Date(message.createdAt).toLocaleTimeString("ja-JP", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      setMessages((prev) => [...prev, formatted]);

      // ブラウザ通知（自分以外からのメッセージのみ）
      if (
        message.sender.id !== currentUserId &&
        Notification.permission === "granted"
      ) {
        new Notification(`新しいメッセージ: ${message.sender.name}`, {
          body: message.content,
        });
      }
    });

    // 4) ソケットでマッチング成立を受信
    socket.on(
      "matchEstablished",
      (data: {
        chatId: string;
        message: string;
        matchedAt: string;
      }) => {
        // このチャットルームのマッチなら通知
        if (data.chatId === chatId && Notification.permission === "granted") {
          new Notification("マッチング成立！", {
            body: `「${data.message}」で ${data.matchedAt} にマッチしました`,
          });
        }
      }
    );

    return () => {
      socket.off("receiveMessage");
      socket.off("matchEstablished");
    };
  }, [chatId, currentUserId]);

  // メッセージ送信
  const handleSend = async () => {
    if (!chatId || !newMessage.trim()) return;
    const senderId = localStorage.getItem("userId");
    if (!senderId) {
      alert("ログインしてください");
      return;
    }
    try {
      const res = await axios.post(`/api/chat/${chatId}`, {
        senderId,
        content: newMessage,
      });
      const msg: Message = { ...res.data };
      // ソケット送信
      socket.emit("sendMessage", msg);
      setNewMessage("");
      // フォーカスを戻す
      inputRef.current?.focus();
    } catch (e) {
      console.error("🚨 送信エラー:", e);
    }
  };

  // 自動スクロール
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // チャット相手名を取得（最初のメッセージ送信者）
  const partner = messages.find((m) => m.sender.id !== currentUserId);
  const partnerName = partner?.sender.name || "チャット";

  return (
    <div className="relative bg-white h-screen">
      {/* ヘッダー */}
      <div className="fixed top-0 left-0 right-0 bg-white flex items-center justify-center px-4 py-2 shadow">
        <button
          onClick={() => router.push("/chat-list")}
          className="absolute left-4"
        >
          <Image src="/icons/back.png" alt="Back" width={24} height={24} />
        </button>
        <h1 className="text-lg font-bold">{partnerName}</h1>
      </div>

      {/* メッセージ一覧 */}
      <div
        className="absolute left-0 right-0 px-4"
        style={{ top: "56px", bottom: "64px", overflowY: "auto" }}
      >
        <div className="space-y-3">
          {messages.map((msg) => {
            const isMe = msg.sender.id === currentUserId;
            return (
              <div
                key={msg.id}
                className={`flex items-end ${
                  isMe ? "justify-end" : "justify-start"
                }`}
              >
                {!isMe && (
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white mr-2"
                    style={{ backgroundColor: getBgColor(msg.sender.name) }}
                  >
                    {getInitials(msg.sender.name)}
                  </div>
                )}
                <div className="flex items-end gap-2">
                  {isMe && (
                    <span className="text-xs text-gray-400">
                      {msg.formattedDate}
                    </span>
                  )}
                  <div
                    className={`relative max-w-xs px-3 py-2 text-sm text-black rounded-lg shadow ${
                      isMe ? "bg-blue-100 bubble-right" : "bg-gray-100 bubble-left"
                    }`}
                  >
                    {msg.content}
                  </div>
                  {!isMe && (
                    <span className="text-xs text-gray-400">
                      {msg.formattedDate}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* 入力欄 */}
      <div
        className="fixed left-0 right-0 bg-white px-4 py-2 shadow"
        style={{ bottom: 0 }}
      >
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="メッセージを入力..."
            className="flex-1 border border-gray-300 rounded-full px-4 py-2 focus:outline-none"
          />
          <button
            onClick={handleSend}
            className="bg-black text-white px-4 py-2 rounded-full hover:bg-gray-800 transition"
          >
            送信
          </button>
        </div>
      </div>

      {/* 吹き出しのトゲ */}
      <style jsx>{`
        .bubble-left::before {
          content: "";
          position: absolute;
          top: 8px;
          left: -6px;
          width: 12px;
          height: 12px;
          background: #f3f3f3;
          transform: rotate(45deg);
          border-radius: 2px;
        }
        .bubble-right::before {
          content: "";
          position: absolute;
          top: 8px;
          right: -6px;
          width: 12px;
          height: 12px;
          background: #cce4ff;
          transform: rotate(45deg);
          border-radius: 2px;
        }
      `}</style>
    </div>
  );
}
