import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(req: NextRequest) {
  try {
    const messages = await prisma.presetMessage.findMany({
      orderBy: { createdAt: 'desc' }
    })
    // 各メッセージの送信回数を取得
    const messagesWithCount = await Promise.all(
      messages.map(async (msg) => {
        const count = await prisma.sentMessage.count({ where: { message: msg.content } })
        return { ...msg, count }
      })
    )
    return NextResponse.json(messagesWithCount)
  } catch (error) {
    return NextResponse.json({ error: '取得に失敗しました' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { content, createdBy } = await req.json()
    if (!content || !createdBy) {
      return NextResponse.json({ error: '内容と作成者IDは必須です' }, { status: 400 })
    }
    const newMessage = await prisma.presetMessage.create({
      data: { content, createdBy }
    })
    return NextResponse.json(newMessage)
  } catch (error) {
    return NextResponse.json({ error: '作成に失敗しました' }, { status: 500 })
  }
}

// プリセットメッセージ全削除API（管理用）
export async function DELETE(req: NextRequest) {
  try {
    await prisma.presetMessage.deleteMany({})
    return NextResponse.json({ message: 'All preset messages deleted' })
  } catch (error) {
    return NextResponse.json({ error: '削除に失敗しました' }, { status: 500 })
  }
}
