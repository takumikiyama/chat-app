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

  // どちらのパス→どちらのパスかを見て direction を +1 / -1 / 0 で決める
  useEffect(() => {
    const prev = prevPathRef.current;
    if (prev && pathname) {
      if (prev === "/chat-list" && pathname.startsWith("/chat/")) {
        setDirection(+1);   // forward
      } else if (
        prev.startsWith("/chat/") &&
        pathname === "/chat-list"
      ) {
        setDirection(-1);   // backward
      } else {
        setDirection(0);
      }
    }
    prevPathRef.current = pathname;
  }, [pathname]);

  const variants = {
    initial: (dir: number) => ({
      x: dir > 0 ? "100%" : "0%",  // backward は最初から画面上にいる
      opacity: dir > 0 ? 0.6 : 1,
      scale: dir > 0 ? 1.02 : 1,
    }),
    animate: { x: "0%", opacity: 1, scale: 1 },
    exit: (dir: number) => ({
      x: dir > 0 ? "-100%" : "100%",  // forward のときは左へ、backward のときは右へ
      opacity: dir > 0 ? 0.6 : 1,
      transition: { duration: 0.25 },
    }),
  };

  return (
    <AnimatePresence initial={false} mode="wait" custom={direction}>
      <motion.div
        key={pathname}
        custom={direction}
        variants={variants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{ type: "spring", stiffness: 260, damping: 30 }}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          zIndex: 1000,
          background: "#fff",
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}