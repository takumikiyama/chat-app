// app/api/chat/[chatId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { io as ioClient } from "socket.io-client";

const prisma = new PrismaClient();
// ブラウザ／API 両方から参照できるように next.config.js で公開している前提です
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL!;

/**
 * GET /api/chat/[chatId]
 * ─────────────────────
 * URL の第二引数で渡される params.chatId を使います
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: { chatId: string } }
) {
  const { chatId } = params;
  if (!chatId) {
    return NextResponse.json(
      { error: "Chat ID が指定されていません" },
      { status: 400 }
    );
  }

  try {
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

    // そのままメッセージ一覧を返却
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
 * ─────────────────────
 * 保存後に sendMessage を emit  → WebSocket サーバーが newMessage として全クライアントに broadcast
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: { chatId: string } }
) {
  const { chatId } = params;
  try {
    const { senderId, content } = await _req.json();

    // バリデーション
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

    // WebSocket サーバーに送信
    const socket = ioClient(SOCKET_URL, { transports: ["websocket"] });
    socket.emit("sendMessage", {
      chatId,
      message: newMessage,
    });
    socket.disconnect();

    return NextResponse.json(newMessage);
  } catch (error) {
    console.error("🚨 メッセージ送信エラー:", error);
    return NextResponse.json(
      { error: "メッセージ送信に失敗しました" },
      { status: 500 }
    );
  }
}