// app/api/chat/[chatId]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { io as ioClient } from "socket.io-client";
import webpush, { PushSubscription as WebPushSubscription } from "web-push";

const prisma = new PrismaClient();
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL!;

// VAPID 鍵の設定
webpush.setVapidDetails(
  "https://chat-app-beta-amber-91.vercel.app",
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

/**
 * GET /api/chat/[chatId]
 */
export async function GET(req: NextRequest) {
  try {
    const { pathname } = new URL(req.url);
    const segments = pathname.split("/");
    const chatId = segments[segments.length - 1];

    if (!chatId) {
      return NextResponse.json(
        { error: "Chat ID が指定されていません" },
        { status: 400 }
      );
    }

    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
          include: { sender: { select: { id: true, name: true } } },
        },
      },
    });

    if (!chat) {
      return NextResponse.json(
        { error: "指定されたチャットが見つかりません" },
        { status: 404 }
      );
    }

    return NextResponse.json(chat.messages);
  } catch (error) {
    console.error("🚨 チャット取得エラー:", error);
    return NextResponse.json(
      { error: "メッセージ取得に失敗しました" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/chat/[chatId]
 * DB にメッセージを保存 → Socket.IO → Web Push
 */
export async function POST(req: NextRequest) {
  try {
    const { pathname } = new URL(req.url);
    const segments = pathname.split("/");
    const chatId = segments[segments.length - 1];

    const { senderId, content } = await req.json();

    if (!chatId || !senderId || !content) {
      return NextResponse.json(
        { error: "chatId, senderId, content はすべて必須です" },
        { status: 400 }
      );
    }

    // チャットの存在確認
    const chat = await prisma.chat.findUnique({ where: { id: chatId } });
    if (!chat) {
      return NextResponse.json(
        { error: "指定されたチャットが見つかりません" },
        { status: 404 }
      );
    }

    // メッセージ保存
    const newMessage = await prisma.message.create({
      data: { chatId, senderId, content },
      include: { sender: { select: { id: true, name: true } } },
    });

    // → Socket.IO でリアルタイム配信
    const socket = ioClient(SOCKET_URL, { transports: ["websocket"] });
    socket.emit("sendMessage", { chatId, message: newMessage });
    socket.disconnect();

    // → Web Push 通知
    const receiverId =
      chat.user1Id === senderId ? chat.user2Id : chat.user1Id;

    // 有効購読情報を取得
    const subs = await prisma.pushSubscription.findMany({
      where: { userId: receiverId, isActive: true },
    });

    const payload = JSON.stringify({
      type: "message",
      chatId,
      title: `${newMessage.sender.name} さんから新着メッセージ`,
      body: newMessage.content,
    });

    // 型アサーションで JsonValue → WebPushSubscription
    await Promise.all(
      subs.map((s) =>
        webpush.sendNotification(
          s.subscription as unknown as WebPushSubscription,
          payload
        )
      )
    );

    return NextResponse.json(newMessage);
  } catch (error) {
    console.error("🚨 メッセージ送信エラー:", error);
    return NextResponse.json(
      { error: "メッセージ送信に失敗しました" },
      { status: 500 }
    );
  }
}