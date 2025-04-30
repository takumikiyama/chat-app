// app/components/ClientPageTransitionWrapper.tsx
"use client";

import { ReactNode, useRef, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";

interface Props {
  children: ReactNode;
}

export default function ClientPageTransitionWrapper({ children }: Props) {
  const pathname = usePathname();
  const prevPathRef = useRef<string | null>(null);
  const [dir, setDir] = useState(0);

  // 1) 前後のパスを見て dir を +1, -1, 0 にセット
  useEffect(() => {
    const prev = prevPathRef.current;
    if (prev && pathname) {
      const isChatList = prev === "/chat-list";
      const isChatPage = /^\/chat\/[^/]+$/.test(prev);
      const nextIsChatList = pathname === "/chat-list";
      const nextIsChatPage = /^\/chat\/[^/]+$/.test(pathname);

      if (isChatList && nextIsChatPage) {
        setDir(+1);
      } else if (isChatPage && nextIsChatList) {
        setDir(-1);
      } else {
        setDir(0);
      }
    }
    prevPathRef.current = pathname;
  }, [pathname]);

  // 2) variants 定義
  const variants = {
    initial: (d: number) => {
      if (d === +1) return { x: "100%", opacity: 0.8 };
      if (d === -1) return { x: "0%", opacity: 1 };
      return { x: 0, opacity: 1 };
    },
    animate: { x: "0%", opacity: 1 },
    exit: (d: number) => {
      if (d === +1) return { x: "-100%", opacity: 0.8 };
      if (d === -1) return { x: "100%", opacity: 1 };
      return { x: 0, opacity: 1 };
    },
  };

  return (
    <AnimatePresence initial={false} mode="wait" custom={dir}>
      <motion.div
        key={pathname}
        custom={dir}
        variants={variants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{ type: "tween", duration: 0.3 }}
        style={{
          position: dir !== 0 ? "fixed" : "relative",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          background: "#ffffff",
          zIndex: dir !== 0 ? 1000 : "auto",
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}