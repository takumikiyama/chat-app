import { io } from "socket.io-client";

// ✅ WebSocket サーバーのURLを環境変数から取得（開発環境用のデフォルトを設定）
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "ws://localhost:3001";

// ✅ WebSocket インスタンスを作成
const socket = io(SOCKET_URL, {
  withCredentials: true,
  transports: ["websocket"],
});

export default socket;