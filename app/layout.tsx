import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'

import PushRegistrar from './components/PushRegistrar'
import { ChatDataProvider } from '@/app/contexts/ChatDataContext'

// フォント設定
const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin']
})
const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin']
})

// メタ情報
export const metadata: Metadata = {
  title: 'Glance',
  description: 'matching chat App',
  icons: {
    icon: '/icons/icon-192x192.png',
    shortcut: '/icons/icon-192x192.png',
    apple: '/icons/apple-touch-icon.png'
  }
}

// RootLayout本体
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icons/icon-192x192.png" />
        <link rel="icon" type="image/png" sizes="512x512" href="/icons/icon-512x512.png" />
        <meta name="theme-color" content="#ffffff" />
        <meta name="color-scheme" content="light" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ChatDataProvider>{children}</ChatDataProvider>
        <PushRegistrar />
      </body>
    </html>
  )
}
