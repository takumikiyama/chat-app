"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import axios from "axios";
import socket from "@/app/socket"; // ✅ WebSocket クライアントをインポート

type Message = {
  id: string;
  sender: {
    id: string;
    name: string;
  };
  content: string;
  createdAt: string;
  formattedDate?: string;
};

export default function Chat() {
  const { chatId } = useParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");

  useEffect(() => {
    if (!chatId) {
      console.error("🚨 chatId が取得できません！");
      return;
    }

    // ✅ メッセージの取得
    const fetchMessages = async () => {
      try {
        const response = await axios.get(`/api/chat/${chatId}`);
        const fetchedMessages = response.data.map((msg: Message) => ({
          ...msg,
          formattedDate: new Date(msg.createdAt).toLocaleString("ja-JP", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          }),
        }));
        setMessages(fetchedMessages);
      } catch (error) {
        console.error("🚨 メッセージ取得エラー:", error);
      }
    };

    fetchMessages();

    // ✅ WebSocket の接続
    socket.on("connect", () => {
      console.log("✅ WebSocket に接続成功！", socket.id);
    });

    socket.on("receiveMessage", (message: Message) => {
      console.log("📩 WebSocket でメッセージ受信:", message);
      setMessages((prevMessages) => [...prevMessages, message]);
    });

    return () => {
      socket.off("receiveMessage");
    };
  }, [chatId]);

  // ✅ メッセージの送信
  const sendMessage = async () => {
    if (!chatId) return;

    try {
      const userId = localStorage.getItem("userId");
      if (!userId) {
        alert("ログインしてください");
        return;
      }

      const response = await axios.post(`/api/chat/${chatId}`, {
        senderId: userId,
        content: newMessage,
      });

      const message = response.data;

      socket.emit("sendMessage", message); // ✅ WebSocket に送信
      setNewMessage(""); // ✅ 入力欄をクリア
    } catch (error) {
      console.error("🚨 送信エラー:", error);
    }
  };

  return (
    <div className="p-5">
      <h1 className="text-2xl mb-4">チャット</h1>
      <ul className="space-y-2">
        {messages.map((msg) => (
          <li key={msg.id} className="border p-3 rounded-lg">
            <strong>{msg.sender?.name || "不明なユーザー"}</strong>: {msg.content}
            <br />
            <small className="text-gray-500">{msg.formattedDate}</small>
          </li>
        ))}
      </ul>
      <div className="mt-4 flex gap-2">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          className="border p-2 w-full"
          placeholder="メッセージを入力..."
        />
        <button onClick={sendMessage} className="bg-blue-500 text-white p-2">
          送信
        </button>
      </div>
    </div>
  );
}