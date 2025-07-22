"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import type { Message } from "@/app/chat/[chatId]/page";
import type { ChatItem } from "@/app/chat-list/page";

// チャットごとのメッセージキャッシュ
type ChatMap = Record<string, Message[]>;

// Contextの型定義
type ChatContextType = {
  chatData: ChatMap;
  setChatData: React.Dispatch<React.SetStateAction<ChatMap>>;
  chatList: ChatItem[] | null;
  setChatList: React.Dispatch<React.SetStateAction<ChatItem[] | null>>;
};

// Contextの作成
const ChatDataContext = createContext<ChatContextType | undefined>(undefined);

// Providerコンポーネント
export function ChatDataProvider({ children }: { children: ReactNode }) {
  const [chatData, setChatData] = useState<ChatMap>({});
  const [chatList, setChatList] = useState<ChatItem[] | null>(null);

  return (
    <ChatDataContext.Provider value={{ chatData, setChatData, chatList, setChatList }}>
      {children}
    </ChatDataContext.Provider>
  );
}

// Hookによるコンテキスト利用
export function useChatData() {
  const context = useContext(ChatDataContext);
  if (!context) {
    throw new Error("useChatData must be used within ChatDataProvider");
  }
  return context;
}
