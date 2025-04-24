// app/api/chat/[chatId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { io as ioClient } from "socket.io-client";

const prisma = new PrismaClient();
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL!;

/**
 * GET /api/chat/[chatId]
 * → URL をパースして chatId を取り出す
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
 * → 同様に URL から chatId を取得し、
 *    DB 保存後に WebSocket 経由で broadcast
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

    const chat = await prisma.chat.findUnique({ where: { id: chatId } });
    if (!chat) {
      return NextResponse.json(
        { error: "指定されたチャットが見つかりません" },
        { status: 404 }
      );
    }

    const newMessage = await prisma.message.create({
      data: { chatId, senderId, content },
      include: { sender: { select: { id: true, name: true } } },
    });

    // WebSocket サーバーへ送信
    const socket = ioClient(SOCKET_URL, { transports: ["websocket"] });
    socket.emit("sendMessage", { chatId, message: newMessage });
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