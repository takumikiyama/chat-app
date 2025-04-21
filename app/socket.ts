// app/socket.ts
import { io, Socket } from "socket.io-client";

// WebSocket サーバーの URL を環境変数から取得（開発時はローカルフォールバック）
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "ws://localhost:3001";

// Socket.IO クライアントを初期化
const socket: Socket = io(SOCKET_URL, {
  withCredentials: true,
  transports: ["websocket"],
});

// ブラウザの Notification API が使えるか確認
if (typeof window !== "undefined" && "Notification" in window) {
  // 初回アクセス時に権限をリクエスト
  if (Notification.permission === "default") {
    Notification.requestPermission();
  }

  // ————————————————  
  // マッチング成立通知  
  // サーバー側で
  //    socket.emit("newMatch", { matchedUserName, message });
  // の形で通知を飛ばす想定です
  socket.on(
    "newMatch",
    (data: { matchedUserName: string; message: string }) => {
      if (Notification.permission === "granted") {
        new Notification("🎉 マッチング成立！", {
          body: `${data.matchedUserName}さんと「${data.message}」でマッチしました！`,
        });
      }
    }
  );

  // ————————————————  
  // 新着チャットメッセージ通知  
  // サーバー側で
  //    socket.emit("newMessage", { sender: { name }, content, chatId });
  // の形で通知を飛ばす想定です
  socket.on(
    "newMessage",
    (data: { sender: { name: string }; content: string; chatId: string }) => {
      if (Notification.permission === "granted") {
        new Notification("💬 新しいメッセージ", {
          body: `${data.sender.name}: ${data.content}`,
        });
      }
    }
  );
}

export default socket;
