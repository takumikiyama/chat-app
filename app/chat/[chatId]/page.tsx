"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import axios from "axios";
import io, { Socket } from "socket.io-client";

type Message = {
  id: string;
  sender: {
    id: string;
    name: string;
  };
  content: string;
  createdAt: string;
  formattedDate?: string; // フォーマット済みの日付
};

export default function Chat() {
  const { chatId } = useParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    if (!chatId) {
      console.error("🚨 chatId が取得できません！");
      return;
    }

    // メッセージの取得
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

    // WebSocket の接続
    const socketInstance: Socket = io("http://localhost:3001");
    setSocket(socketInstance);

    socketInstance.on("connect", () => {
      console.log("✅ WebSocket に接続成功！", socketInstance.id);
    });

    // ✅ WebSocket で受信したメッセージをそのまま追加（重複チェックは不要）
    socketInstance.on("receiveMessage", (message: Message) => {
      const formattedMessage = {
        ...message,
        formattedDate: new Date(message.createdAt).toLocaleString("ja-JP", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      setMessages((prevMessages) => [...prevMessages, formattedMessage]);
    });

    return () => {
      socketInstance.disconnect();
    };
  }, [chatId]);

  // メッセージの送信
  const sendMessage = async () => {
    if (!chatId || !socket) return;

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
    <div>
      <h1>チャット</h1>
      <ul>
        {messages.map((msg) => (
          <li key={msg.id}>
            <strong>{msg.sender?.name || "不明なユーザー"}</strong>: {msg.content}
            <br />
            <small>{msg.formattedDate}</small>
          </li>
        ))}
      </ul>
      <input
        type="text"
        value={newMessage}
        onChange={(e) => setNewMessage(e.target.value)}
      />
      <button onClick={sendMessage}>送信</button>
    </div>
  );
}