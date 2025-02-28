"use client";
import { useEffect, useState } from "react";
import axios from "axios";

interface SentMessage {
  id: string;
  receiver: { id: string; name: string };
  message: string;
  createdAt: string;
  isMatched: boolean; // ✅ 追加（マッチング済みか）
}

interface MatchedPair {
  id: string;
  user1: { id: string; name: string };
  user2: { id: string; name: string };
  message: string;
  matchedAt: string;
}

export default function Notifications() {
  const [sentMessages, setSentMessages] = useState<SentMessage[]>([]);
  const [matchedPairs, setMatchedPairs] = useState<MatchedPair[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    setUserId(storedUserId);
  }, []);

  useEffect(() => {
    if (!userId) return;

    axios.get(`/api/notifications?userId=${userId}`)
      .then((res) => {
        setSentMessages(res.data.sentMessages);
        setMatchedPairs(res.data.matchedPairs);
      })
      .catch((error) => console.error("🚨 通知データ取得エラー:", error));
  }, [userId]);

  const cancelMessage = async (messageId: string) => {
    try {
      const response = await axios.delete("/api/cancel-message", {
        data: { messageId, senderId: userId },
      });

      if (response.data.success) {
        setSentMessages(sentMessages.filter((msg) => msg.id !== messageId));
        alert("メッセージを取り消しました！");
      }
    } catch (error) {
      console.error("🚨 メッセージ削除エラー:", error);
      alert("メッセージの取り消しに失敗しました");
    }
  };

  return (
    <div className="p-5">
      <h1 className="text-2xl mb-4">通知</h1>

      {/* 送信済みマッチメッセージ */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">送信済みマッチメッセージ</h2>
        {sentMessages.length > 0 ? (
          <ul className="space-y-2">
            {sentMessages.map((msg) => (
              <li key={msg.id} className="border p-3 rounded-lg flex justify-between items-center">
                <div>
                  <p><strong>宛先:</strong> {msg.receiver.name}</p>
                  <p><strong>メッセージ:</strong> {msg.message}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(msg.createdAt).toLocaleString()}
                  </p>
                </div>
                {msg.isMatched ? (
                  <button className="bg-gray-400 text-white px-3 py-1 rounded-lg cursor-not-allowed">
                    マッチング済
                  </button>
                ) : (
                  <button
                    onClick={() => cancelMessage(msg.id)}
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

      {/* マッチング履歴 */}
      <div>
        <h2 className="text-lg font-semibold mb-2">マッチング履歴</h2>
        {matchedPairs.length > 0 ? (
          <ul className="space-y-2">
            {matchedPairs.map((match) => {
              const matchedUser = match.user1.id === userId ? match.user2 : match.user1;
              return (
                <li key={match.id} className="border p-3 rounded-lg">
                  <p><strong>マッチ相手:</strong> {matchedUser.name}</p>
                  <p><strong>マッチメッセージ:</strong> {match.message}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(match.matchedAt).toLocaleString()}
                  </p>
                </li>
              );
            })}
          </ul>
        ) : (
          <p>マッチング履歴はありません。</p>
        )}
      </div>
    </div>
  );
}