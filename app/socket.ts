import { Server } from "socket.io";
import { createServer } from "http";

let io: Server | null = null;

export function initSocket() {
  if (!io) {
    const httpServer = createServer();
    io = new Server(httpServer, {
      cors: {
        origin: "*", // ✅ CORS の設定
      },
    });

    io.on("connection", (socket) => {
      console.log("⚡️ ユーザーが接続しました");

      socket.on("sendMessage", (message) => {
        console.log("📩 新しいメッセージ:", message);
        io?.emit("receiveMessage", message); // ✅ すべてのクライアントに送信
      });

      socket.on("disconnect", () => {
        console.log("❌ ユーザーが切断しました");
      });
    });

    httpServer.listen(3001, () => console.log("🚀 WebSocket サーバー起動 (ポート: 3001)"));
  }
}
