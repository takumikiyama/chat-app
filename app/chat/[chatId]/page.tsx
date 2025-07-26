// app/chat/[chatId]/page.tsx
'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import axios from 'axios'
import socket from '@/app/socket'
import Image from 'next/image'
import { useChatData } from '@/app/contexts/ChatDataContext'

// ————————————————
// ヘルパー：ユーザー名からイニシャルを生成
function getInitials(name: string) {
  return name
    .split(' ')
    .map((w) => w.charAt(0))
    .join('')
    .toUpperCase()
}

// ヘルパー：ユーザー名から背景色をハッシュ的に決定
function getBgColor(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  const h = hash % 360
  return `hsl(${h}, 70%, 80%)`
}

export type Message = {
  id: string
  sender: { id: string; name: string }
  content: string
  createdAt: string
  formattedDate?: string
}

export default function Chat() {
  const router = useRouter()
  const { chatId } = useParams()
  const { chatData, chatList, isPreloading } = useChatData()
  const initialMessages = chatData[chatId as string] as Message[] | undefined

  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [matchMessage, setMatchMessage] = useState<string>('')
  const [isSending, setIsSending] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)

  // 1) ログインユーザーIDを取得
  useEffect(() => {
    setCurrentUserId(localStorage.getItem('userId'))
  }, [])

  // 2) Contextからマッチメッセージを取得
  useEffect(() => {
    if (chatList && chatId) {
      const chat = chatList.find((c) => c.chatId === chatId)
      if (chat) {
        setMatchMessage(chat.matchMessage || '')
      }
    }
  }, [chatList, chatId])

  // 3) 事前フェッチされたデータがあれば即セット
  useEffect(() => {
    if (initialMessages) {
      setMessages(initialMessages)
    }
  }, [initialMessages])

  // 4) Contextにデータがない場合のみAPIから取得
  useEffect(() => {
    if (!chatId || initialMessages || isPreloading) return
    ;(async () => {
      try {
        const res = await axios.get<Message[]>(`/api/chat/${chatId}`)
        const formatted = res.data.map((msg) => ({
          ...msg,
          formattedDate: new Date(msg.createdAt).toLocaleString('ja-JP', {
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
          })
        }))
        setMessages(formatted)
      } catch (e) {
        console.error('🚨 メッセージ取得エラー:', e)
      }
    })()

    // ルーム参加
    socket.emit('joinChat', chatId)

    // 新着メッセージ受信
    const handleNewMessage = (payload: { chatId: string; message: Message }) => {
      if (payload.chatId !== chatId) return
      const { message } = payload
      const formatted: Message = {
        ...message,
        formattedDate: new Date(message.createdAt).toLocaleTimeString('ja-JP', {
          hour: '2-digit',
          minute: '2-digit'
        })
      }
      setMessages((prev) => [...prev, formatted])
    }
    socket.on('newMessage', handleNewMessage)

    return () => {
      socket.off('newMessage', handleNewMessage)
    }
  }, [chatId, initialMessages, isPreloading])

  // 4) メッセージ更新時に自動スクロール
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // 5) メッセージ送信
  const handleSend = async () => {
    if (!chatId || !newMessage.trim() || isSending) return
    const senderId = localStorage.getItem('userId')
    if (!senderId) {
      alert('ログインしてください')
      return
    }

    setIsSending(true)
    const contentToSend = newMessage
    setNewMessage('')

    // 仮表示
    const tempMessage: Message = {
      id: `temp-${Date.now()}`,
      sender: { id: senderId, name: '自分' },
      content: contentToSend,
      createdAt: new Date().toISOString(),
      formattedDate: new Date().toLocaleTimeString('ja-JP', {
        hour: '2-digit',
        minute: '2-digit'
      })
    }
    setMessages((prev) => [...prev, tempMessage])

    try {
      const res = await axios.post<Message>(`/api/chat/${chatId}`, {
        senderId,
        content: contentToSend
      })
      socket.emit('sendMessage', { chatId, message: res.data })
      inputRef.current?.focus()
    } catch (e) {
      console.error('🚨 送信エラー:', e)
    } finally {
      setIsSending(false)
    }
  }

  // 6) ヘッダー表示用
  const partner = messages.find((m) => m.sender.id !== currentUserId)
  const partnerName = partner?.sender.name || 'チャット'

  // ローディング状態の表示
  if (isPreloading && messages.length === 0) {
    return (
      <div className="flex flex-col bg-white h-screen">
        <header className="sticky top-0 z-10 bg-white px-4 py-2 flex flex-col items-center">
          <button onClick={() => router.push('/chat-list')} className="absolute left-4 top-2 focus:outline-none">
            <Image src="/icons/back.png" alt="Back" width={20} height={20} />
          </button>
          <h1 className="text-base font-bold text-black">読み込み中...</h1>
        </header>
        <main className="flex-1 flex items-center justify-center">
          <div className="text-gray-500">チャットデータを読み込み中...</div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex flex-col bg-white h-screen">
      {/* ヘッダー */}
      <header className="sticky top-0 z-10 bg-white px-4 py-2 flex flex-col items-center">
        <button onClick={() => router.push('/chat-list')} className="absolute left-4 top-2 focus:outline-none">
          <Image src="/icons/back.png" alt="Back" width={20} height={20} />
        </button>
        <h1 className="text-base font-bold text-black">{partnerName}</h1>
        {matchMessage && <p className="text-sm text-gray-700 mt-1">「{matchMessage}」</p>}
      </header>

      {/* メッセージ一覧 */}
      <main className="flex-1 px-4 overflow-y-auto pb-32">
        <div className="space-y-3 py-2">
          {messages.map((msg) => {
            const isMe = msg.sender.id === currentUserId
            return (
              <div key={msg.id} className={`flex items-end ${isMe ? 'justify-end' : 'justify-start'}`}>
                {!isMe && (
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white mr-2"
                    style={{ backgroundColor: getBgColor(msg.sender.name) }}
                  >
                    {getInitials(msg.sender.name)}
                  </div>
                )}
                <div className="flex items-end gap-2">
                  {isMe && <span className="text-xs text-gray-400">{msg.formattedDate}</span>}
                  <div
                    className={`relative max-w-xs px-3 py-2 text-sm text-black rounded-lg ${
                      isMe ? 'bg-blue-100 bubble-right' : 'bg-gray-100 bubble-left'
                    }`}
                  >
                    {msg.content}
                  </div>
                  {!isMe && <span className="text-xs text-gray-400">{msg.formattedDate}</span>}
                </div>
              </div>
            )
          })}
        </div>
        <div ref={messagesEndRef} className="h-6" />
      </main>

      {/* 入力欄 */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white px-4 py-3 shadow flex items-center">
        <input
          ref={inputRef}
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="メッセージを入力"
          className="flex-1 border border-gray-300 rounded-full px-4 py-2 focus:outline-none"
        />
        <button onClick={handleSend} className="ml-2 p-2 rounded-full">
          <Image src={newMessage.trim() ? '/icons/send.png' : '/icons/message.png'} alt="Send" width={24} height={24} />
        </button>
      </footer>

      {/* 吹き出しのトゲ */}
      <style jsx>{`
        .bubble-left::before {
          content: '';
          position: absolute;
          top: 8px;
          left: -6px;
          width: 12px;
          height: 12px;
          background: #f3f3f3;
          transform: rotate(45deg);
          border-radius: 2px;
        }
        .bubble-right::before {
          content: '';
          position: absolute;
          top: 8px;
          right: -6px;
          width: 12px;
          height: 12px;
          background: #cce4ff;
          transform: rotate(45deg);
          border-radius: 2px;
        }
      `}</style>
    </div>
  )
}
