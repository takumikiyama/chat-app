// app/api/chat/[chatId]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

// Prisma クライアントを初期化
const prisma = new PrismaClient();
// WebSocket サーバーの URL を環境変数から取得

/**
 * GET /api/chat/[chatId]
 * 指定された chatId のメッセージ一覧を取得して返す
 */
export async function GET(req: NextRequest) {
  try {
    // req.url はフル URL
    const url = new URL(req.url);
    // パスを "/" で分割して最後の要素を chatId とする
    const segments = url.pathname.split("/");
    const chatId = segments[segments.length - 1];

    if (!chatId) {
      return NextResponse.json(
        { error: "Chat ID が指定されていません" },
        { status: 400 }
      );
    }

    // 指定チャットのメッセージを取得
    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
          include: {
            sender: { select: { id: true, name: true } },
          },
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
 * 新しいメッセージを保存し、WebSocket でリアルタイム通知
 */
export async function POST(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const segments = url.pathname.split("/");
    const chatId = segments[segments.length - 1];

    const { senderId, content } = await req.json();

    if (!chatId || !senderId || !content) {
      return NextResponse.json(
        { error: "chatId, senderId, content はすべて必須です" },
        { status: 400 }
      );
    }

    // チャット存在確認
    const chat = await prisma.chat.findUnique({ where: { id: chatId } });
    if (!chat) {
      return NextResponse.json(
        { error: "指定されたチャットが見つかりません" },
        { status: 404 }
      );
    }

    // メッセージを保存
    const newMessage = await prisma.message.create({
      data: { chatId, senderId, content },
      include: { sender: { select: { id: true, name: true } } },
    });

    return NextResponse.json(newMessage);
  } catch (error) {
    console.error("🚨 メッセージ送信エラー:", error);
    return NextResponse.json(
      { error: "メッセージ送信に失敗しました" },
      { status: 500 }
    );
  }
}
