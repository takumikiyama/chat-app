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
  const [direction, setDirection] = useState(0);

  // 前回のパスを保存して、今回の移動方向を判定
  useEffect(() => {
    const prev = prevPathRef.current;
    if (prev && pathname) {
      // /chat-list → /chat/:id のときは forward (右から入る)
      if (prev === "/chat-list" && pathname.startsWith("/chat/")) {
        setDirection(1);
      }
      // /chat/:id → /chat-list のときは backward (左から入る)
      else if (prev.startsWith("/chat/") && pathname === "/chat-list") {
        setDirection(-1);
      } else {
        setDirection(0);
      }
    }
    prevPathRef.current = pathname;
  }, [pathname]);

  // variants で x 軸スライドをカスタム
  const variants = {
    initial: (dir: number) => ({
      x: dir * 300,
      opacity: 0,
    }),
    animate: { x: 0, opacity: 1 },
    exit: (dir: number) => ({
      x: -dir * 300,
      opacity: 0,
    }),
  };

  return (
    <AnimatePresence initial={false} custom={direction}>
      <motion.div
        key={pathname}
        custom={direction}
        variants={variants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        style={{ position: "absolute", width: "100%" }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}