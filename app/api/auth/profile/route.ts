import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const SECRET_KEY: string = process.env.JWT_SECRET || "";

if (!SECRET_KEY) {
  throw new Error("JWT_SECRET is not defined in environment variables");
}

// ✅ ユーザー情報を取得
export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, SECRET_KEY) as { id: string; email: string };

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { name: true, email: true, bio: true }, // ✅ bioを取得
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Profile fetch error:", error);
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }
}

// ✅ ユーザー情報を更新（名前・自己紹介）
export async function PUT(req: Request) {
  try {
    const { name, bio } = await req.json();

    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, SECRET_KEY) as { id: string };

    const updatedUser = await prisma.user.update({
      where: { id: decoded.id },
      data: { name, bio },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
