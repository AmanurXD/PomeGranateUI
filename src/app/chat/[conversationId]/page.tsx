"use client";

import { ChatHeader } from "@/components/chat/chat-header";
import { MessageList } from "@/components/chat/message-list";
import { Composer } from "@/components/chat/composer";
import { useChat } from "@/components/chat/chat-store";
import { useEffect, useState, use } from "react";

export default function ConversationPage({
    params,
}: {
    params: Promise<{ conversationId: string }>;
}) {
    const { conversationId } = use(params);
    const { setActiveConversationId, setMessages } = useChat();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        async function loadConversation() {
            setLoading(true);
            setError("");
            setActiveConversationId(conversationId);

            try {
                const res = await fetch(`/api/conversations/${conversationId}`);
                if (!res.ok) {
                    setError("Conversation not found");
                    return;
                }

                const data = await res.json();
                const msgs = data.messages.map((m: any) => ({
                    id: m.id,
                    conversationId: m.conversationId,
                    role: m.role,
                    content: m.content,
                    parentId: m.parentId,
                    metadata: m.metadata,
                    createdAt: m.createdAt,
                    versions: m.versions,
                    feedback: m.feedback?.[0] || null,
                }));
                setMessages(msgs);
            } catch (e) {
                setError("Failed to load conversation");
            } finally {
                setLoading(false);
            }
        }

        loadConversation();
    }, [conversationId, setActiveConversationId, setMessages]);

    if (error) {
        return (
            <>
                <ChatHeader />
                <div className="flex-1 flex items-center justify-center">
                    <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                        {error}
                    </p>
                </div>
            </>
        );
    }

    return (
        <>
            <ChatHeader />
            {loading ? (
                <div className="flex-1 p-4">
                    <div className="max-w-3xl mx-auto space-y-6">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="flex gap-4">
                                <div className="w-8 h-8 rounded-full skeleton flex-shrink-0" />
                                <div className="flex-1 space-y-2">
                                    <div className="skeleton h-4 w-24" />
                                    <div className="skeleton h-4 w-full" />
                                    <div className="skeleton h-4 w-3/4" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <MessageList />
            )}
            <Composer />
        </>
    );
}
