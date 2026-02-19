"use client";

import { ChatHeader } from "@/components/chat/chat-header";
import { MessageList } from "@/components/chat/message-list";
import { Composer } from "@/components/chat/composer";
import { useChat } from "@/components/chat/chat-store";
import { useEffect } from "react";

export default function ChatPage() {
    const { resetChat } = useChat();

    // Reset active conversation when navigating to /chat (new chat)
    useEffect(() => {
        resetChat();
    }, [resetChat]);

    return (
        <>
            <ChatHeader />
            <MessageList />
            <Composer />
        </>
    );
}
