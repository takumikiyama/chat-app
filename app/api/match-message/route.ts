// app/api/match-message/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

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
      // MatchPair 作成 if needed
      const existingMatchPair = await prisma.matchPair.findFirst({
        where: {
          OR: [
            { user1Id: senderId, user2Id: matchedUserId },
            { user1Id: matchedUserId, user2Id: senderId },
          ],
        },
      });
      if (!existingMatchPair) {
        await prisma.matchPair.create({
          data: { user1Id: senderId, user2Id: matchedUserId, message },
        });
      }

      // Chat 作成 if needed
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

      // ※ プッシュ通知はここでは行わず、
      //    別途 /api/push-match などで実装予定

      return NextResponse.json({ message: "Match created!" });
    }

    // 4) マッチ未成立の場合
    return NextResponse.json({ message: "Message sent, waiting for a match!" });
  } catch (error) {
    console.error("🚨 マッチングエラー:", error);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}