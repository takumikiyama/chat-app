"use client";

import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";

export default function FixedTabBar() {
    const router = useRouter();
    const pathname = usePathname();

    const mainIcon = pathname === "/main" ? "/icons/star.png" : "/icons/star blank.png";
    const chatIcon = pathname === "/chat-list" ? "/icons/chat.png" : "/icons/chat blank.png";
    const profileIcon = pathname === "/profile" ? "/icons/home.png" : "/icons/home blank.png";

    return (
        <div className="fixed bottom-4 left-0 right-0 bg-white flex justify-around items-center px-5 py-3">
            <button onClick={() => router.push("/main")} className="focus:outline-none">
                <Image src={mainIcon} alt="Main" width={26} height={26} />
            </button>
            <button onClick={() => router.push("/chat-list")} className="focus:outline-none">
                <Image src={chatIcon} alt="Chat" width={26} height={26} />
            </button>
            <button onClick={() => router.push("/profile")} className="focus:outline-none">
                <Image src={profileIcon} alt="Profile" width={26} height={26} />
            </button>
        </div>
    );
}