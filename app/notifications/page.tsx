"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import Image from "next/image";

interface SentMessage {
  id: string;
  receiver: { id: string; name: string };
  message: string;
  createdAt: string;
  isMatched: boolean;
}

interface MatchedPair {
  id: string;
  user1: { id: string; name: string };
  user2: { id: string; name: string };
  message: string;
  matchedAt: string;
}

export default function Notifications() {
  const router = useRouter();
  const [sentMessages, setSentMessages] = useState<SentMessage[]>([]);
  const [matchedPairs, setMatchedPairs] = useState<MatchedPair[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [cancelPopup, setCancelPopup] = useState<SentMessage | null>(null);

  // ログインユーザー取得
  useEffect(() => {
    const storedId = localStorage.getItem("userId");
    setUserId(storedId);
  }, []);

  // 通知データ取得
  useEffect(() => {
    if (!userId) return;
    axios
      .get(`/api/notifications?userId=${userId}`)
      .then((res) => {
        setSentMessages(res.data.sentMessages);
        setMatchedPairs(res.data.matchedPairs);
      })
      .catch((e) => console.error("🚨 通知データ取得エラー:", e));
  }, [userId]);

  // 送信キャンセル確認
  const handleCancelRequest = (msg: SentMessage) => {
    setCancelPopup(msg);
  };

  // キャンセル実行
  const handleConfirmCancel = async () => {
    if (!cancelPopup || !userId) return;
    try {
      const res = await axios.delete("/api/cancel-message", {
        data: { messageId: cancelPopup.id, senderId: userId },
      });
      if (res.data.success) {
        setSentMessages((prev) => prev.filter((m) => m.id !== cancelPopup.id));
      }
    } catch (e) {
      console.error("🚨 メッセージ削除エラー:", e);
      alert("メッセージの取り消しに失敗しました");
    } finally {
      setCancelPopup(null);
    }
  };

  return (
    <div className="p-5 max-w-md mx-auto relative">
      {/* 戻る */}
      <button
        onClick={() => router.push("/main")}
        className="absolute left-4 top-5"
      >
        <Image src="/icons/back.png" alt="Back" width={24} height={24} />
      </button>

      <h1 className="text-2xl font-bold mb-4 text-center">History</h1>

      {/* Sent Messages */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Sent Messages</h2>
        {sentMessages.length > 0 ? (
          <ul className="space-y-2">
            {sentMessages.map((msg) => (
              <li
                key={msg.id}
                className="p-3 flex justify-between items-center border rounded-lg relative"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: '#ccc' /* or dynamic */ }}
                  >
                    {msg.receiver.name.charAt(0)}
                  </div>
                  <div>
                    <p><strong>To</strong> {msg.receiver.name}</p>
                    <p>{msg.message}</p>
                    <span className="absolute top-2 right-2 text-sm text-gray-500">
                      {new Date(msg.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>
                {msg.isMatched ? (
                  <button className="bg-gray-400 text-white px-3 py-1 rounded-lg cursor-not-allowed">
                    マッチング済
                  </button>
                ) : (
                  <button
                    onClick={() => handleCancelRequest(msg)}
                    className="bg-red-500 text-white px-3 py-1 rounded-lg"
                  >
                    取り消し
                  </button>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p>送信したマッチメッセージはありません。</p>
        )}
      </div>

      {/* Match History */}
      <div>
        <h2 className="text-lg font-semibold mb-2">Match History</h2>
        {matchedPairs.length > 0 ? (
          <ul className="space-y-2">
            {matchedPairs.map((match) => {
              const partner = match.user1.id === userId ? match.user2 : match.user1;
              return (
                <li
                  key={match.id}
                  className="p-3 border rounded-lg flex items-center gap-3 relative"
                >
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: '#aaa' /* or dynamic */ }}
                  >
                    {partner.name.charAt(0)}
                  </div>
                  <div>
                    <p>{partner.name}</p>
                    <p>{match.message}</p>
                    <span className="absolute top-2 right-2 text-sm text-gray-500">
                      {new Date(match.matchedAt).toLocaleString()}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <p>マッチング履歴はありません。</p>
        )}
      </div>

      {/* Confirm Cancel Popup */}
      {cancelPopup && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="bg-white p-5 rounded-xl shadow-lg w-11/12 max-w-sm">
            <h3 className="text-lg font-bold mb-2">Confirmation</h3>
            <p className="mb-1"><strong>To:</strong> {cancelPopup.receiver.name}</p>
            <p className="mb-2"><strong>Message:</strong> {cancelPopup.message}</p>
            <p className="text-sm text-red-500 mb-4">Once deleted, it cannot be undone.</p>
            <div className="flex justify-center gap-3">
              <button
                onClick={handleConfirmCancel}
                className="bg-red-500 text-white px-6 py-2 rounded-full hover:bg-red-600 transition"
              >
                Delete
              </button>
              <button
                onClick={() => setCancelPopup(null)}
                className="bg-gray-500 text-white px-6 py-2 rounded-full hover:bg-gray-600 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
