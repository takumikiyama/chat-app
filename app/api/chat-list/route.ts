import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    const userId = req.headers.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    // チャットリストを取得
    const chats = await prisma.chat.findMany({
      where: {
        OR: [{ user1Id: userId }, { user2Id: userId }],
      },
      include: {
        user1: { select: { id: true, name: true } },
        user2: { select: { id: true, name: true } },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1, // ✅ 最新のメッセージのみ取得
        },
      },
    });

    // チャットごとにマッチメッセージを取得
    const chatList = await Promise.all(
      chats.map(async (chat) => {
        const matchedUser = chat.user1Id === userId ? chat.user2 : chat.user1;
        const latestMessage = chat.messages.length > 0 ? chat.messages[0].content : "メッセージなし";
        const latestMessageAt = chat.messages.length > 0 ? chat.messages[0].createdAt : chat.createdAt;

        // ✅ MatchPair テーブルからマッチメッセージを取得
        const matchPair = await prisma.matchPair.findFirst({
          where: {
            OR: [
              { user1Id: chat.user1Id, user2Id: chat.user2Id },
              { user1Id: chat.user2Id, user2Id: chat.user1Id },
            ],
          },
          select: { message: true },
        });

        return {
          chatId: chat.id,
          matchedUser: {
            id: matchedUser.id,
            name: matchedUser.name,
          },
          matchMessage: matchPair?.message || "（マッチメッセージなし）",
          latestMessage,
          latestMessageAt,
        };
      })
    );

    return NextResponse.json(chatList);
  } catch (error) {
    console.error("🚨 チャットリスト取得エラー:", error);
    return NextResponse.json({ error: "Failed to fetch chat list" }, { status: 500 });
  }
}