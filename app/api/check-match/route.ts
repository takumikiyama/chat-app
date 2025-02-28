import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

console.log(Object.keys(prisma));

export async function POST(req: Request) {
  try {
    const { senderId, message } = await req.json();

    // 自分が送ったマッチメッセージを相手が送っているかチェック
    const matches = await prisma.sentMessage.findMany({
      where: { receiverId: senderId, message },
    });

    for (const match of matches) {
      // すでにマッチしていないか確認
      const existingMatch = await prisma.matchPair.findFirst({
        where: { user1Id: senderId, user2Id: match.senderId, message },
      });

      if (!existingMatch) {
        // マッチング成立を記録
        await prisma.matchPair.create({
          data: { user1Id: senderId, user2Id: match.senderId, message },
        });

        // チャットを作成
        await prisma.chat.create({
          data: { user1Id: senderId, user2Id: match.senderId },
        });
      }
    }

    return NextResponse.json({ message: "Match checked!" });
  } catch (error) {
    console.error("Error checking match:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
