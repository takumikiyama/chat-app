'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { useChatData } from '@/app/contexts/ChatDataContext'
import FixedTabBar from '../components/FixedTabBar'

// チャットリストアイテムの型定義
export interface ChatItem {
  chatId: string
  matchedUser: { id: string; name: string }
  matchMessage: string
  latestMessage: string
  latestMessageAt: string // フォーマット済み日時
  latestMessageAtRaw: string // 生の日時文字列
  latestMessageSenderId: string // 最新メッセージの送信者ID
  latestMessageAtDisplay: string // ユーザーに表示するためのフォーマット済み日時
}

// ユーザー名からイニシャル生成
function getInitials(name: string) {
  return name
    .split(' ')
    .map((w) => w.charAt(0))
    .join('')
    .toUpperCase()
}

// ユーザー名から背景色ハッシュ
function getBgColor(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  const h = hash % 360
  return `hsl(${h}, 70%, 80%)`
}

function formatChatDate(dateString: string | null): string {
  if (!dateString) return ''
  const now = new Date()
  const date = new Date(dateString)
  // 当日
  if (
    now.getFullYear() === date.getFullYear() &&
    now.getMonth() === date.getMonth() &&
    now.getDate() === date.getDate()
  ) {
    return `${date.getHours()}:${date.getMinutes()}`
  }
  // 昨日
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  if (
    date.getFullYear() === yesterday.getFullYear() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getDate() === yesterday.getDate()
  ) {
    return '昨日'
  }
  // 2〜5日前は曜日
  for (let i = 2; i <= 5; i++) {
    const prev = new Date(now)
    prev.setDate(now.getDate() - i)
    if (
      date.getFullYear() === prev.getFullYear() &&
      date.getMonth() === prev.getMonth() &&
      date.getDate() === prev.getDate()
    ) {
      const week = ['日', '月', '火', '水', '木', '金', '土']
      return week[date.getDay()]
    }
  }
  // 6日前以前は月/日
  return `${date.getMonth() + 1}/${date.getDate()}`
}

export default function ChatList() {
  const router = useRouter()
  const { chatList, setChatList } = useChatData()
  const [unreadCounts, setUnreadCounts] = useState<{ [chatId: string]: number }>({})
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    setUserId(localStorage.getItem('userId'))
  }, [])

  // チャットを開いたら最終閲覧時刻を記録
  const handleOpenChat = (chatId: string) => {
    localStorage.setItem(`chat-last-read-${chatId}`, new Date().toISOString())
    setUnreadCounts((prev) => ({ ...prev, [chatId]: 0 }))
    router.push(`/chat/${chatId}`)
  }

  if (!chatList) {
    return <div>読み込み中...</div>
  }

  return (
    <div className="flex flex-col h-[100dvh] bg-white overflow-hidden">
      {/* 固定ヘッダー */}
      <div className="shrink-0 bg-white z-10 p-4 border-b">
        <h1 className="text-2xl font-bold text-center">Chat</h1>
      </div>

      {/* スクロール可能リスト */}
      <div className="flex-1 overflow-y-auto px-3 py-4">
        {chatList.length === 0 ? (
          <p className="text-center text-gray-500">まだチャットがありません</p>
        ) : (
          <ul className="space-y-2 pb-20">
            {chatList.map((chat) => {
              const isLatestFromMe = chat.latestMessageSenderId === userId
              return (
                <li
                  key={chat.chatId}
                  onClick={() => handleOpenChat(chat.chatId)}
                  className="flex items-center bg-white rounded-2xl shadow-md px-4 py-3 cursor-pointer hover:bg-gray-50 transition border border-gray-100"
                >
                  {/* アイコン */}
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-xl mr-4 shadow"
                    style={{ backgroundColor: getBgColor(chat.matchedUser.name) }}
                  >
                    {getInitials(chat.matchedUser.name)}
                  </div>
                  {/* 本文 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-base font-semibold text-black truncate">{chat.matchedUser.name}</span>
                      <div className="flex flex-col items-end min-w-[56px]">
                        <span className="text-xs text-gray-400 ml-2 whitespace-nowrap">
                          {chat.latestMessageAtDisplay}
                        </span>
                        {/* 未読バッジ */}
                        {unreadCounts[chat.chatId] > 0 && !isLatestFromMe && (
                          <span className="mt-1 flex items-center justify-center w-6 h-6 rounded-full bg-green-500 text-white text-xs font-bold">
                            {unreadCounts[chat.chatId]}
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 truncate mt-1">「{chat.matchMessage}」</p>
                    <p className="text-sm text-gray-500 truncate mt-0.5">{chat.latestMessage}</p>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {/* 下部タブバー */}
      <div className="shrink-0">
        <FixedTabBar />
      </div>
    </div>
  )
}
