// app/api/match-message/route.ts

import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import webpush, { PushSubscription as WebPushSubscription } from "web-push";

const prisma = new PrismaClient();

// VAPID 鍵の設定
webpush.setVapidDetails(
  "https://chat-app-beta-amber-91.vercel.app",
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

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
      // — マッチした両ユーザーの情報を取得 —
      const senderUser = await prisma.user.findUnique({
        where: { id: senderId },
        select: { id: true, name: true },
      });
      const matchedUser = await prisma.user.findUnique({
        where: { id: matchedUserId },
        select: { id: true, name: true },
      });
      if (!senderUser || !matchedUser) {
        throw new Error("User not found");
      }

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
      let chat = await prisma.chat.findFirst({
        where: {
          OR: [
            { user1Id: senderId, user2Id: matchedUserId },
            { user1Id: matchedUserId, user2Id: senderId },
          ],
        },
      });
      if (!chat) {
        chat = await prisma.chat.create({
          data: { user1Id: senderId, user2Id: matchedUserId },
        });
      }

      // — Web Push 通知送信 —
      // 両ユーザーの有効な購読情報を取得
      const subs = await prisma.pushSubscription.findMany({
        where: {
          OR: [
            { userId: senderId,      isActive: true },
            { userId: matchedUserId, isActive: true },
          ],
        },
      });

      // 購読ごとに相手ユーザーを判別して通知ペイロードを作成
      await Promise.all(
        subs.map((s) => {
          // この購読がどちらのユーザーのものか
          const other = s.userId === senderId ? matchedUser : senderUser;

          const payload = JSON.stringify({
            type:            "match",
            chatId:          chat!.id,
            title:           "マッチング成立！",
            body:            `あなたは ${other.name} さんと「${message}」でマッチしました！`,
            matchedUserId:   other.id,
            matchedUserName: other.name,
          });

          return webpush.sendNotification(
            s.subscription as unknown as WebPushSubscription,
            payload
          );
        })
      );

      return NextResponse.json({ message: "Match created!" });
    }

    // マッチ未成立の場合
    return NextResponse.json(
      { message: "Message sent, waiting for a match!" }
    );
  } catch (error) {
    console.error("🚨 マッチングエラー:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}