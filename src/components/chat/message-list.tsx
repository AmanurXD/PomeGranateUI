"use client";

import { useChat } from "@/components/chat/chat-store";
import { MessageItem } from "@/components/chat/message-item";
import { useEffect, useRef, useState } from "react";
import { ArrowDown, Sparkles } from "lucide-react";

export function MessageList() {
    const { messages, isStreaming } = useChat();
    const bottomRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [showScrollBtn, setShowScrollBtn] = useState(false);

    // Auto-scroll on new messages
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isStreaming]);

    // Show scroll-to-bottom button
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        function handleScroll() {
            const { scrollTop, scrollHeight, clientHeight } = container!;
            const atBottom = scrollHeight - scrollTop - clientHeight < 100;
            setShowScrollBtn(!atBottom);
        }

        container.addEventListener("scroll", handleScroll);
        return () => container.removeEventListener("scroll", handleScroll);
    }, []);

    function scrollToBottom() {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }

    // Empty state
    if (messages.length === 0 && !isStreaming) {
        return (
            <div className="flex-1 flex items-center justify-center p-4">
                <div className="text-center max-w-md animate-fade-in">
                    <div
                        className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
                        style={{ background: "var(--accent-light)" }}
                    >
                        <Sparkles className="w-8 h-8" style={{ color: "var(--accent)" }} />
                    </div>
                    <h2 className="text-2xl font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
                        How can I help you today?
                    </h2>
                    <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                        Start a conversation by typing a message below. I can help with analysis, writing, coding, math, and more.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto relative" ref={containerRef}>
            <div className="max-w-3xl mx-auto px-4 py-6">
                {messages.map((msg, i) => (
                    <MessageItem key={msg.id} message={msg} isLast={i === messages.length - 1} />
                ))}

                {/* Typing indicator */}
                {isStreaming && messages[messages.length - 1]?.role !== "assistant" && (
                    <div className="flex gap-4 py-5 animate-fade-in">
                        <div
                            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm"
                            style={{ background: "var(--accent)", color: "var(--text-inverse)" }}
                        >
                            AI
                        </div>
                        <div className="typing-indicator pt-2">
                            <span /><span /><span />
                        </div>
                    </div>
                )}

                <div ref={bottomRef} />
            </div>

            {/* Scroll to bottom */}
            {showScrollBtn && (
                <button
                    onClick={scrollToBottom}
                    className="absolute bottom-4 left-1/2 -translate-x-1/2 p-2.5 rounded-full transition-all animate-fade-in z-10"
                    style={{
                        background: "var(--bg-primary)",
                        border: "1px solid var(--border-default)",
                        boxShadow: "var(--shadow-md)",
                        color: "var(--text-secondary)",
                    }}
                    aria-label="Scroll to bottom"
                >
                    <ArrowDown className="w-4 h-4" />
                </button>
            )}
        </div>
    );
}
