// app/socket.ts
import { io, Socket } from "socket.io-client";

// WebSocket サーバーの URL を環境変数から取得（開発時はローカルフォールバック）
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "ws://localhost:3001";

// Socket.IO クライアントを初期化
const socket: Socket = io(SOCKET_URL, {
  withCredentials: true,
  transports: ["websocket"],
});

// ※ 今後、PWA プッシュ通知の購読処理は service worker で行います。
//    ここではリアルタイム UI 更新用にのみ利用します。

export default socket;