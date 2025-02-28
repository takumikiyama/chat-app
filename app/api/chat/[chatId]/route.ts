import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ✅ チャット履歴を取得 (GET)
export async function GET(req: Request, { params }: { params: { chatId: string } }) {
  try {
    const { chatId } = params; // `params` から `chatId` を取得

    if (!chatId) {
      return NextResponse.json({ error: "Chat ID is required" }, { status: 400 });
    }

    // ✅ チャットが存在するか確認
    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
          include: { sender: { select: { id: true, name: true } } }, // 送信者の情報を取得
        },
      },
    });

    if (!chat) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }

    return NextResponse.json(chat.messages);
  } catch (error) {
    console.error("🚨 チャット取得エラー:", error);
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
  }
}

// ✅ メッセージを送信 (POST)
export async function POST(req: Request, { params }: { params: { chatId: string } }) {
  try {
    const { chatId } = params; // `params` から `chatId` を取得
    const body = await req.json();
    const { senderId, content } = body;

    if (!chatId || !senderId || !content) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    // ✅ チャットが存在するか確認
    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
    });

    if (!chat) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }

    // ✅ メッセージをデータベースに保存
    const newMessage = await prisma.message.create({
      data: {
        chatId,
        senderId,
        content,
      },
      include: { sender: { select: { id: true, name: true } } },
    });

    return NextResponse.json(newMessage);
  } catch (error) {
    console.error("🚨 メッセージ送信エラー:", error);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}