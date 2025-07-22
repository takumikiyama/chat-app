// app/components/ClientPageTransitionWrapper.tsx
'use client'

import { ReactNode, useRef, useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'

interface Props {
  children: ReactNode
}

export default function ClientPageTransitionWrapper({ children }: Props) {
  const pathname = usePathname()
  const prevPathRef = useRef<string | null>(null)
  const [dir, setDir] = useState(0)

  // 前回パス ↔ 今回パスを比較し、
  // chat-list → chat/:id なら +1（右→左）
  // chat/:id → chat-list なら -1（左→右）
  // それ以外は 0（アニメーションなし）
  useEffect(() => {
    const prev = prevPathRef.current
    if (prev) {
      const wasList = prev === '/chat-list'
      const isList = pathname === '/chat-list'
      const wasChat = /^\/chat\/[^/]+$/.test(prev)
      const isChat = /^\/chat\/[^/]+$/.test(pathname)

      if (wasList && isChat) setDir(+1)
      else if (wasChat && isList) setDir(-1)
      else setDir(0)
    }
    prevPathRef.current = pathname
  }, [pathname])

  // チャット関連ページ以外ならアニメーションを完全にスキップ
  if (dir === 0) {
    return <>{children}</>
  }

  // dir に応じて x 軸スライドの向きを切り替える
  const variants = {
    initial: (d: number) => ({ x: `${d * 100}%` }),
    animate: { x: '0%' },
    exit: (d: number) => ({ x: `${-d * 100}%` })
  }

  return (
    <AnimatePresence initial={false} mode="sync" custom={dir}>
      <motion.div
        key={pathname}
        custom={dir}
        variants={variants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{ type: 'tween', duration: 0.3 }}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: '#ffffff',
          zIndex: 1000
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
