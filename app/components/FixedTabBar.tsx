"use client";

import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";

export default function FixedTabBar() {
    const router = useRouter();
    const pathname = usePathname();

    const mainIcon = pathname === "/" ? "/icons/star.png" : "/icons/star blank.png";
    const chatIcon = pathname === "/chat-list" ? "/icons/chat.png" : "/icons/chat blank.png";
    const profileIcon = pathname === "/profile" ? "/icons/home.png" : "/icons/home blank.png";

    return (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-white/60 rounded-full shadow-2xl flex justify-center items-center gap-8 px-5 py-2">
            <button onClick={() => router.push("/main")}>
                <Image src={mainIcon} alt="Main" width={26} height={26} />
            </button>
            <button onClick={() => router.push("/chat-list")}>
                <Image src={chatIcon} alt="Chat" width={26} height={26} />
            </button>
            <button onClick={() => router.push("/profile")}>
                <Image src={profileIcon} alt="Profile" width={26} height={26} />
            </button>
        </div>
    );
}