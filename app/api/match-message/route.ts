// app/api/match-message/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { io as ioClient } from "socket.io-client";

const prisma = new PrismaClient();
// WebSocket サーバーの URL を環境変数から取得
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL!;

export async function POST(req: NextRequest) {
  try {
    const { senderId, receiverIds, message } = await req.json();

    if (!senderId || !receiverIds?.length || !message) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    let matchedUserId: string | null = null;

    // 1) 送信メッセージを保存しつつ、マッチを探す
    for (const receiverId of receiverIds) {
      await prisma.sentMessage.create({
        data: { senderId, receiverId, message },
      });

      const existingMatch = await prisma.sentMessage.findFirst({
        where: {
          senderId: receiverId,
          receiverId: senderId,
          message,
        },
      });

      if (existingMatch) {
        matchedUserId = receiverId;
        break;
      }
    }

    // 2) マッチ成立時の処理
    if (matchedUserId) {
      console.log(`🎉 マッチング成立！${senderId} ⇄ ${matchedUserId}`);

      // -- MatchPair がなければ作成
      const existingMatchPair = await prisma.matchPair.findFirst({
        where: {
          OR: [
            { user1Id: senderId, user2Id: matchedUserId },
            { user1Id: matchedUserId, user2Id: senderId },
          ],
        },
      });
      const matchPair = existingMatchPair
        ? existingMatchPair
        : await prisma.matchPair.create({
            data: { user1Id: senderId, user2Id: matchedUserId, message },
            include: {
              user1: { select: { id: true, name: true } },
              user2: { select: { id: true, name: true } },
            },
          });

      // -- Chat がなければ作成
      const existingChat = await prisma.chat.findFirst({
        where: {
          OR: [
            { user1Id: senderId, user2Id: matchedUserId },
            { user1Id: matchedUserId, user2Id: senderId },
          ],
        },
      });
      if (!existingChat) {
        await prisma.chat.create({
          data: { user1Id: senderId, user2Id: matchedUserId },
        });
      }

      // 3) WebSocket サーバーへマッチ成立通知を emit
      const socket = ioClient(SOCKET_URL, { transports: ["websocket"] });
      socket.emit("matchEstablished", {
        chatId: matchPair.id,
        user1: matchPair.user1Id,
        user2: matchPair.user2Id,
        message: matchPair.message,
        matchedAt: matchPair.matchedAt,
      });
      socket.disconnect();

      return NextResponse.json({ message: "Match created!" });
    }

    // 4) マッチ未成立の場合
    return NextResponse.json({ message: "Message sent, waiting for a match!" });
  } catch (error) {
    console.error("🚨 マッチングエラー:", error);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
