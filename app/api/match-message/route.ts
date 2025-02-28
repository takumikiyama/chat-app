import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { senderId, receiverIds, message } = await req.json();

    if (!senderId || !receiverIds.length || !message) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    let matchedUserId: string | null = null;

    for (const receiverId of receiverIds) {
      // ✅ 送信メッセージをDBに保存
      await prisma.SentMessage.create({
        data: {
          senderId,
          receiverId,
          message,
        },
      });

      // ✅ 相手が同じメッセージを送っているか確認
      const existingMatch = await prisma.SentMessage.findFirst({
        where: {
          senderId: receiverId,
          receiverId: senderId,
          message, // ✅ 送信メッセージが一致するか確認
        },
      });

      if (existingMatch) {
        matchedUserId = receiverId;
        break;
      }
    }

    if (matchedUserId) {
      console.log(`🎉 マッチング成立！${senderId} ⇄ ${matchedUserId}`);

      // ✅ `MatchPair` がすでに作成されているか確認
      const existingMatchPair = await prisma.MatchPair.findFirst({
        where: {
          OR: [
            { user1Id: senderId, user2Id: matchedUserId },
            { user1Id: matchedUserId, user2Id: senderId },
          ],
        },
      });

      if (!existingMatchPair) {
        await prisma.MatchPair.create({
          data: {
            user1Id: senderId,
            user2Id: matchedUserId,
            message,
          },
        });

        console.log("✅ MatchPair 作成");
      }

      // ✅ `Chat` がすでに存在するか確認
      const existingChat = await prisma.Chat.findFirst({
        where: {
          OR: [
            { user1Id: senderId, user2Id: matchedUserId },
            { user1Id: matchedUserId, user2Id: senderId },
          ],
        },
      });

      if (!existingChat) {
        await prisma.Chat.create({
          data: {
            user1Id: senderId,
            user2Id: matchedUserId,
          },
        });

        console.log("✅ Chat 作成");
      }

      return NextResponse.json({ message: "Match created!" });
    }

    return NextResponse.json({ message: "Message sent, waiting for a match!" });
  } catch (error) {
    console.error("🚨 マッチングエラー:", error);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}