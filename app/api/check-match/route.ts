// app/api/check-match/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { io as ioClient } from "socket.io-client";

const prisma = new PrismaClient();
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL!;

/**
 * POST /api/check-match
 * ────────────────────
 * 自分が receiver になった sentMessage をチェックし、
 * マッチがなければ作成 → WebSocket で matchEstablished を emit
 */
export async function POST(req: NextRequest) {
  try {
    const { senderId, message } = await req.json();
    if (!senderId || !message) {
      return NextResponse.json(
        { error: "senderId と message は必須です" },
        { status: 400 }
      );
    }

    // 自分が receiver になっているメッセージを取得
    const matches = await prisma.sentMessage.findMany({
      where: { receiverId: senderId, message },
    });

    for (const match of matches) {
      // 既存の matchPair がないかチェック
      const existing = await prisma.matchPair.findFirst({
        where: {
          OR: [
            { user1Id: senderId, user2Id: match.senderId, message },
            { user1Id: match.senderId, user2Id: senderId, message },
          ],
        },
      });
      if (existing) continue;

      // 新規 MatchPair 作成
      const newPair = await prisma.matchPair.create({
        data: {
          user1Id: senderId,
          user2Id: match.senderId,
          message,
        },
      });
      // Chat テーブルにも作成
      await prisma.chat.create({
        data: {
          user1Id: senderId,
          user2Id: match.senderId,
        },
      });

      // WebSocket サーバーにマッチ成立を通知 → socket-server はそれを受けて newMatch を broadcast
      const socket = ioClient(SOCKET_URL, { transports: ["websocket"] });
      socket.emit("matchEstablished", {
        chatId: newPair.id,
        message: newPair.message,
        matchedAt: newPair.matchedAt.toISOString(),
      });
      socket.disconnect();
    }

    return NextResponse.json({ message: "Match check complete." });
  } catch (error) {
    console.error("🚨 Match チェックエラー:", error);
    return NextResponse.json(
      { error: "Match チェック中にエラーが発生しました" },
      { status: 500 }
    );
  }
}