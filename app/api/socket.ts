import { NextApiRequest, NextApiResponse } from "next";
import { Server as SocketIOServer } from "socket.io"; // ✅ `Server` 型をインポート
import { initSocket } from "@/app/socket";

type CustomSocket = {
  server: {
    io?: SocketIOServer; // ✅ `any` を `SocketIOServer` に変更
  };
} & NextApiResponse["socket"];

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const socketServer = res.socket as CustomSocket; // ✅ カスタム型を適用

  if (!socketServer.server.io) {
    console.log("🔌 WebSocket を初期化");
    initSocket();
    socketServer.server.io = new SocketIOServer(); // ✅ `io` に正しい型を設定
  } else {
    console.log("⚡️ WebSocket はすでに初期化されています");
  }

  res.end();
}
