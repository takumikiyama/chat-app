'use client'

import { useEffect, useState } from 'react'
import axios from 'axios'
import Image from 'next/image'
import FixedTabBar from '../components/FixedTabBar'
import { useRouter } from 'next/navigation'

interface User {
  id: string
  name: string
  bio: string
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
}

function getBgColorLight(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  const h = hash % 360
  return `hsl(${h}, 70%, 90%)`
}

function getBgColor(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  const h = hash % 360
  return `hsl(${h}, 70%, 80%)`
}

type PresetMessage = {
  id: string
  content: string
  createdBy: string
  createdAt: string
  count: number
}

// チャットリスト用 日付・時刻・曜日表示関数

export default function Main() {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [selectedMessage, setSelectedMessage] = useState<string | null>(null)
  const [selectedRecipientIds, setSelectedRecipientIds] = useState<string[]>([])
  const [isSent, setIsSent] = useState(false)
  const [matchCount, setMatchCount] = useState<number>(0)
  const [step, setStep] = useState<'select-message' | 'select-recipients'>('select-message')
  const [sentMessageInfo, setSentMessageInfo] = useState<{ message: string; recipients: string[] } | null>(null)
  const [touchStartX, setTouchStartX] = useState<number | null>(null)
  const [isHistoryNavigating, setIsHistoryNavigating] = useState(false)
  const router = useRouter()
  const [isInputMode, setIsInputMode] = useState(false)
  const [inputMessage, setInputMessage] = useState('')
  const [inputSending, setInputSending] = useState(false)
  const [presetMessages, setPresetMessages] = useState<PresetMessage[]>([])
  const [isSending, setIsSending] = useState(false)

  useEffect(() => {
    const uid = localStorage.getItem('userId')
    if (!uid) return
    axios
      .get<{ count: number }>('/api/match-message/count', { headers: { userId: uid } })
      .then((res) => setMatchCount(res.data.count))
      .catch((e) => console.error('件数取得エラー:', e))
  }, [])

  useEffect(() => {
    setCurrentUserId(localStorage.getItem('userId'))
  }, [])

  useEffect(() => {
    axios
      .get<User[]>('/api/users')
      .then((res) => setUsers(res.data))
      .catch((e) => console.error('ユーザー取得エラー:', e))
  }, [])

  // プリセットメッセージ取得
  useEffect(() => {
    fetch('/api/preset-message')
      .then((res) => res.json())
      .then((data) => {
        setPresetMessages(data)
      })
  }, [])

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX)
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return
    const touchEndX = e.changedTouches[0].clientX
    const deltaX = touchEndX - touchStartX
    const SWIPE_THRESHOLD = 100

    if (deltaX < -SWIPE_THRESHOLD && step === 'select-message') {
      setStep('select-recipients')
    } else if (deltaX > SWIPE_THRESHOLD && step === 'select-recipients') {
      setStep('select-message')
    }

    setTouchStartX(null)
  }

  const handleHistoryNavigation = () => {
    setIsHistoryNavigating(true)
    setTimeout(() => {
      router.push('/notifications')
    }, 300)
  }

  const handleSelectMessage = (msg: string) => {
    setSelectedMessage((prev) => (prev === msg ? null : msg))
    setInputMessage('') // ことばを選択したら入力欄をクリア
  }

  const toggleRecipient = (id: string) => {
    setSelectedRecipientIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  // メッセージ選択肢（初期MESSAGES＋プリセットメッセージ）
  const messageOptions = [...presetMessages]

  // 送信待機バーのmessage.pngタップ時の処理
  const handleMessageIconClick = () => {
    if (isInputMode && inputMessage.trim()) {
      setSelectedMessage(inputMessage.trim())
      setIsInputMode(false)
      setStep('select-recipients')
    } else if (selectedMessage) {
      setStep('select-recipients')
    }
  }

  // send.pngタップ時の処理
  const handleSend = async () => {
    if (!selectedMessage || selectedRecipientIds.length === 0 || !currentUserId || isSending) {
      return
    }
    setIsSending(true)
    // 送信完了通知を即時表示
    setSentMessageInfo({ message: selectedMessage, recipients: [...selectedRecipientIds] })
    setIsSent(true)
    // 送信待機バーの情報を即リセット
    const messageToSend = selectedMessage
    const recipientsToSend = [...selectedRecipientIds]
    setSelectedMessage(null)
    setSelectedRecipientIds([])
    setStep('select-message')
    setIsInputMode(false)
    setInputMessage('')
    try {
      // 新規ことばの場合のみAPIにPOST
      const isPreset = presetMessages.some((m) => m.content === messageToSend)
      if (!isPreset) {
        const res = await fetch('/api/preset-message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: messageToSend, createdBy: currentUserId })
        })
        if (res.ok) {
          // プリセットメッセージリストを再取得
          const data = await fetch('/api/preset-message').then((r) => r.json())
          setPresetMessages(data as PresetMessage[])
        } else {
          alert('ことばの登録に失敗しました')
          setIsSending(false)
          setIsSent(false)
          setSentMessageInfo(null)
          return
        }
      }
      await axios.post('/api/match-message', {
        senderId: currentUserId,
        receiverIds: recipientsToSend,
        message: messageToSend
      })
      if (navigator.vibrate) navigator.vibrate([200, 100, 200])
      setTimeout(() => {
        setIsSent(false)
        setSentMessageInfo(null)
      }, 4000)
    } catch (error) {
      console.error('送信エラー:', error)
      alert('メッセージの送信に失敗しました')
      setIsSent(false)
      setSentMessageInfo(null)
    } finally {
      setIsSending(false)
    }
  }

  // 新規メッセージ送信（プリセット登録）
  const handleInputSend = async () => {
    if (!inputMessage.trim() || !currentUserId) return
    setInputSending(true)
    try {
      const res = await fetch('/api/preset-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: inputMessage, createdBy: currentUserId })
      })
      if (res.ok) {
        // 新規メッセージを即時選択肢に反映
        setSelectedMessage(inputMessage)
        setIsInputMode(false)
        setInputMessage('')
        // 必要ならMESSAGESやプリセット一覧を再取得
      } else {
        alert('作成に失敗しました')
      }
    } finally {
      setInputSending(false)
    }
  }

  // 送信ボタンの条件
  const canSend = selectedMessage && selectedRecipientIds.length > 0

  return (
    <>
      {/* ヘッダー */}
      <div className="fixed top-0 left-0 w-full bg-white z-10 p-4 flex flex-col items-center overflow-hidden">
        <div className="flex w-full justify-between items-center">
          <div className="w-24 flex items-center">
            <button
              onClick={handleHistoryNavigation}
              className="transition-transform duration-200 ease-out active:scale-150 focus:outline-none"
            >
              <Image src="/icons/history.png" alt="Notifications" width={24} height={24} className="cursor-pointer" />
            </button>
          </div>
          <div />
          <h1
            className="text-3xl font-bold text-black whitespace-nowrap absolute left-1/2 transform -translate-x-1/2 mt-1"
            style={{ fontFamily: "'Poppins', sans-serif" }}
          >
            Happy Ice Cream
          </h1>
          <div className="w-24" />
        </div>
        <p className="text-sm text-gray-800 text-center leading-snug mt-4">
          お互いが同じことばをシェアし合ったら初めて通知されます。今日は <strong>{matchCount}</strong> 件受信済。
        </p>
      </div>

      {/* ── 送信待機バー ── */}
      <div
        className={`fixed top-24 left-4 right-4 z-20 py-1 flex items-center h-16 pl-2 pr-2 shadow rounded-xl overflow-hidden
          ${
            selectedMessage && selectedRecipientIds.length > 0
              ? 'bg-orange-500'
              : selectedMessage || selectedRecipientIds.length > 0
                ? 'bg-orange-350'
                : 'bg-orange-300'
          }
        `}
      >
        <div className="flex-1 flex flex-col justify-between h-full overflow-x-auto pr-2">
          {!selectedMessage || !messageOptions.some((m) => m.content === selectedMessage) ? (
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Aa..."
              className="flex-1 px-2 py-1 rounded border text-base"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && inputMessage.trim()) {
                  setSelectedMessage(inputMessage.trim())
                  setIsInputMode(false)
                  setStep('select-recipients')
                }
              }}
              onBlur={(e) => {
                if (inputMessage.trim()) {
                  setSelectedMessage(inputMessage.trim())
                  setIsInputMode(false)
                  setStep('select-recipients')
                }
              }}
            />
          ) : (
            <span
              onClick={() => {
                setSelectedMessage(null)
              }}
              className={`${selectedMessage ? 'font-bold text-white' : 'text-gray-100'} cursor-pointer`}
            >
              {selectedMessage}
            </span>
          )}
          <div className="flex overflow-x-auto whitespace-nowrap scrollbar-hide">
            {selectedRecipientIds.length > 0 ? (
              selectedRecipientIds.map((id, idx) => {
                const u = users.find((u) => u.id === id)
                return (
                  <span key={id} onClick={() => toggleRecipient(id)} className="inline-block mr-1 font-bold text-white">
                    {u?.name}
                    {idx < selectedRecipientIds.length - 1 ? ',' : ''}
                  </span>
                )
              })
            ) : (
              <span className="text-gray-200">誰に送る？</span>
            )}
          </div>
        </div>
        <button
          onClick={canSend ? handleSend : handleMessageIconClick}
          className="flex-none px-1 py-1 transition-transform duration-200 ease-out active:scale-150 focus:outline-none"
          disabled={!canSend || isSending}
          style={{ minWidth: 36, minHeight: 36 }}
        >
          <Image
            src={canSend ? '/icons/send.png' : '/icons/message.png'}
            alt="send"
            width={24}
            height={24}
            className="filter invert"
          />
        </button>
      </div>

      {/* コンテンツ */}
      <main
        className="flex-1 overflow-y-auto overflow-x-hidden"
        style={{ overscrollBehavior: 'contain', touchAction: 'pan-y' }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className="flex h-full transition-transform duration-450"
          style={{
            transform: step === 'select-message' ? 'translateX(0%)' : 'translateX(-100%)'
          }}
        >
          {/* メッセージ選択 */}
          <div
            className="min-w-full flex-shrink-0 text-lg overflow-y-auto px-5 pt-[180px] pb-[40px]"
            style={{ maxHeight: 'calc(100vh - 140px)' }}
          >
            <div className="flex flex-col gap-3">
              {messageOptions.map((msg) => (
                <button
                  key={msg.id}
                  onClick={() => handleSelectMessage(msg.content)}
                  className={`w-full flex justify-between items-center text-left px-4 py-3 rounded-3xl shadow transition-transform duration-100 ease-out active:scale-95 ${
                    selectedMessage === msg.content ? 'font-bold text-black bg-gray-300' : 'text-gray-700'
                  }`}
                >
                  <span>{msg.content}</span>
                  <span className="text-xs text-gray-500 ml-2 whitespace-nowrap">{msg.count}回シェアされました</span>
                </button>
              ))}
            </div>
          </div>

          {/* 送信先選択 */}
          <div
            className="min-w-full flex-shrink-0 text-lg overflow-y-auto px-5 pt-[180px] pb-[40px]"
            style={{ maxHeight: 'calc(100vh - 140px)' }}
          >
            <div className="flex flex-col gap-2">
              {users
                .filter((u) => u.id !== currentUserId)
                .map((u) => (
                  <div
                    key={u.id}
                    onClick={() => toggleRecipient(u.id)}
                    className="flex items-center gap-3 p-3 rounded-3xl shadow transition-transform duration-100 ease-out active:scale-95"
                    style={{
                      backgroundColor: selectedRecipientIds.includes(u.id) ? getBgColorLight(u.name) : undefined
                    }}
                  >
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                      style={{ backgroundColor: getBgColor(u.name) }}
                    >
                      {getInitials(u.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-lg truncate ${
                          selectedRecipientIds.includes(u.id) ? 'font-bold text-black' : 'text-gray-700'
                        }`}
                      >
                        {u.name}
                      </p>
                    </div>
                    {selectedRecipientIds.includes(u.id) && (
                      <Image src="/icons/check.png" alt="Selected" width={20} height={20} />
                    )}
                  </div>
                ))}
            </div>
          </div>
        </div>
      </main>

      {/* リスト選択エリア（下部固定） */}
      <div className="fixed bottom-[50px] left-[40px] right-[40px] z-20 bg-white py-1.5 px-3 rounded-3xl shadow">
        <div className="relative flex">
          <span
            className="absolute top-0 bottom-0 w-1/2 bg-gray-200 rounded-3xl transition-transform duration-400"
            style={{
              transform: step === 'select-message' ? 'translateX(0%)' : 'translateX(100%)'
            }}
          />
          <button
            onClick={() => setStep('select-message')}
            className="relative z-10 flex-1 py-2 text-center text-sm font-bold text-gray-600"
          >
            ことばリスト
          </button>
          <button
            onClick={() => setStep('select-recipients')}
            className="relative z-10 flex-1 py-2 text-center text-sm font-bold text-gray-600"
          >
            ともだちリスト
          </button>
        </div>
      </div>

      {/* 送信成功メッセージ */}
      {isSent && sentMessageInfo && (
        <div className="fixed top-[50px] left-0 right-0 z-30 overflow-hidden px-2 neon-gradient">
          <div className="w-max whitespace-nowrap animate-slide-in font-bold text-white text-lg px-4 py-2 shadow-lg">
            「{sentMessageInfo.message}」が
            {sentMessageInfo.recipients
              .map((id) => users.find((u) => u.id === id)?.name)
              .filter(Boolean)
              .join(', ')}
            にシェアされました！
          </div>
        </div>
      )}

      {/* 下部タブバー */}
      <FixedTabBar />
    </>
  )
}
