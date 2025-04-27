// app/api/push/subscribe/route.ts

import { NextRequest, NextResponse } from "next/server";
import webpush from "web-push";
import { PrismaClient } from "@prisma/client";
import { verifyJwt } from "@/lib/jwt";

const prisma = new PrismaClient();

// VAPID 鍵の設定
webpush.setVapidDetails(
  "mailto:you@domain.com",
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    // Authorization ヘッダーの検証
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.slice(7);
    const userId = verifyJwt(token);

    // リクエストボディから購読情報を取得
    const { subscription } = await req.json();
    if (!subscription || typeof subscription.endpoint !== "string") {
      return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
    }

    // DB に upsert（既存なら更新、なければ作成）
    await prisma.pushSubscription.upsert({
      where: { endpoint: subscription.endpoint },
      update: {
        subscription,
        userId,
        isActive: true,
      },
      create: {
        endpoint: subscription.endpoint,
        subscription,
        userId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("🚨 Push subscribe error:", error);
    return NextResponse.json({ error: "Failed to subscribe to push" }, { status: 500 });
  }
}