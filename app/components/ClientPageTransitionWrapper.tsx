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
  const prevRef = useRef<string | null>(null);
  const [dir, setDir] = useState(0);

  // 前回のパスと今回のパスを比べて dir を +1, -1, 0 にセット
  useEffect(() => {
    const prev = prevRef.current;
    if (prev && pathname) {
      const wasList = prev === "/chat-list";
      const isList  = pathname === "/chat-list";
      const wasChat = /^\/chat\/[^/]+$/.test(prev);
      const isChat  = /^\/chat\/[^/]+$/.test(pathname);

      if (wasList && isChat)      setDir(+1);
      else if (wasChat && isList) setDir(-1);
      else                         setDir(0);
    }
    prevRef.current = pathname;
  }, [pathname]);

  // これだけで前進／戻りが一貫して動く！
  const variants = {
    initial: (d: number) => ({ x: `${d * 100}%` }),
    animate:            { x: "0%"         },
    exit:    (d: number) => ({ x: `${-d * 100}%` }),
  };

  return (
    <AnimatePresence initial={false} mode="sync" custom={dir}>
      <motion.div
        key={pathname}
        custom={dir}
        variants={variants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{ type: "tween", duration: 0.3 }}
        style={{
          position:   dir !== 0 ? "fixed" : "relative",
          top:        0,
          left:       0,
          width:      "100%",
          height:     "100%",
          background: "#ffffff",
          zIndex:     dir !== 0 ? 1000 : "auto",
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}