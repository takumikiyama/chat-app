'use client'

import { createContext, useContext, useState, ReactNode, useEffect } from 'react'
import type { Message } from '@/app/chat/[chatId]/page'
import type { ChatItem } from '@/app/chat-list/page'
import axios from 'axios'

// チャットごとのメッセージキャッシュ
type ChatMap = Record<string, Message[]>

// Contextの型定義
type ChatContextType = {
  chatData: ChatMap
  setChatData: React.Dispatch<React.SetStateAction<ChatMap>>
  chatList: ChatItem[] | null
  setChatList: React.Dispatch<React.SetStateAction<ChatItem[] | null>>
  isPreloading: boolean
}

// チャットリスト用 日付・時刻・曜日表示関数
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

// Contextの作成
const ChatDataContext = createContext<ChatContextType | undefined>(undefined)

// Providerコンポーネント
export function ChatDataProvider({ children }: { children: ReactNode }) {
  const [chatData, setChatData] = useState<ChatMap>({})
  const [chatList, setChatList] = useState<ChatItem[] | null>(null)
  const [isPreloading, setIsPreloading] = useState(true)

  // アプリ起動時にチャットリストとチャットデータをプリフェッチ
  useEffect(() => {
    const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null
    if (!userId) {
      setIsPreloading(false)
      return
    }

    const preloadData = async () => {
      try {
        // 1. チャットリストを取得
        const chatListRes = await axios.get('/api/chat-list', { headers: { userId } })
        const formattedChatList = chatListRes.data.map((c: any) => ({
          ...c,
          latestMessageAtDisplay: formatChatDate(c.latestMessageAt)
        }))
        setChatList(formattedChatList)

        // 2. 各チャットのメッセージを並行取得
        const chatDataPromises = formattedChatList.map(async (chat) => {
          try {
            const messagesRes = await axios.get<Message[]>(`/api/chat/${chat.chatId}`)
            const formattedMessages = messagesRes.data.map((msg) => ({
              ...msg,
              formattedDate: new Date(msg.createdAt).toLocaleString('ja-JP', {
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
              })
            }))
            return { chatId: chat.chatId, messages: formattedMessages }
          } catch (error) {
            console.error(`チャット ${chat.chatId} のメッセージ取得エラー:`, error)
            return { chatId: chat.chatId, messages: [] }
          }
        })

        const chatDataResults = await Promise.all(chatDataPromises)
        const newChatData: ChatMap = {}
        chatDataResults.forEach(({ chatId, messages }) => {
          newChatData[chatId] = messages
        })
        setChatData(newChatData)
      } catch (error) {
        console.error('プリフェッチエラー:', error)
      } finally {
        setIsPreloading(false)
      }
    }

    preloadData()
  }, [])

  return (
    <ChatDataContext.Provider value={{ chatData, setChatData, chatList, setChatList, isPreloading }}>
      {children}
    </ChatDataContext.Provider>
  )
}

// Hookによるコンテキスト利用
export function useChatData() {
  const context = useContext(ChatDataContext)
  if (!context) {
    throw new Error('useChatData must be used within ChatDataProvider')
  }
  return context
}
