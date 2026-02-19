"use client";

import { useChat } from "@/components/chat/chat-store";
import { useRef, useState, useEffect, useCallback } from "react";
import { ArrowUp, Square, Paperclip, Loader2 } from "lucide-react";
import type { ChatMessage, StreamPayload } from "@/types";

export function Composer() {
    const {
        activeConversationId,
        setActiveConversationId,
        messages,
        addMessage,
        updateMessage,
        isStreaming,
        setIsStreaming,
        settings,
        conversations,
        setConversations,
    } = useChat();

    const [input, setInput] = useState("");
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const abortRef = useRef<AbortController | null>(null);

    // Auto-grow textarea
    useEffect(() => {
        const el = textareaRef.current;
        if (!el) return;
        el.style.height = "auto";
        el.style.height = Math.min(el.scrollHeight, 200) + "px";
    }, [input]);

    // Focus textarea on mount
    useEffect(() => {
        textareaRef.current?.focus();
    }, [activeConversationId]);

    const handleSend = useCallback(async () => {
        const content = input.trim();
        if (!content || isStreaming) return;

        setInput("");
        setIsStreaming(true);

        // Add user message optimistically
        const userMsg: ChatMessage = {
            id: "temp-user-" + Date.now(),
            conversationId: activeConversationId || "",
            role: "user",
            content,
            createdAt: new Date().toISOString(),
        };
        addMessage(userMsg);

        // Add empty assistant message placeholder
        const assistantId = "temp-assistant-" + Date.now();
        const assistantMsg: ChatMessage = {
            id: assistantId,
            conversationId: activeConversationId || "",
            role: "assistant",
            content: "",
            createdAt: new Date().toISOString(),
        };
        addMessage(assistantMsg);

        const abortController = new AbortController();
        abortRef.current = abortController;

        try {
            // Build message history for API
            const msgHistory = [
                ...messages.map((m) => ({ role: m.role, content: m.content })),
                { role: "user" as const, content },
            ];

            const payload: StreamPayload = {
                conversationId: activeConversationId || undefined,
                messages: msgHistory,
                model: settings.defaultModel,
                temperature: settings.temperature,
                maxTokens: settings.maxTokens,
                systemPrompt: settings.systemPrompt,
            };

            const res = await fetch("/api/chat/stream", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
                signal: abortController.signal,
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({ error: "Stream failed" }));
                updateMessage(assistantId, { content: `Error: ${err.error || "Stream failed"}` });
                setIsStreaming(false);
                return;
            }

            // Handle new conversation creation
            const newConvId = res.headers.get("x-conversation-id");
            if (newConvId && !activeConversationId) {
                setActiveConversationId(newConvId);
                window.history.replaceState(null, "", `/chat/${newConvId}`);
                // Add to conversation list
                setConversations([
                    {
                        id: newConvId,
                        title: content.slice(0, 50) || "New conversation",
                        isArchived: false,
                        isPinned: false,
                        updatedAt: new Date().toISOString(),
                        createdAt: new Date().toISOString(),
                    },
                    ...conversations,
                ]);
            }

            // Read SSE stream
            const reader = res.body?.getReader();
            const decoder = new TextDecoder();
            let accumulated = "";

            if (reader) {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const chunk = decoder.decode(value, { stream: true });
                    const lines = chunk.split("\n");

                    for (const line of lines) {
                        if (line.startsWith("data: ")) {
                            const data = line.slice(6);
                            if (data === "[DONE]") break;
                            try {
                                const parsed = JSON.parse(data);
                                if (parsed.token) {
                                    accumulated += parsed.token;
                                    updateMessage(assistantId, { content: accumulated });
                                }
                                if (parsed.sources) {
                                    updateMessage(assistantId, {
                                        metadata: { sources: parsed.sources },
                                    });
                                }
                                if (parsed.messageId) {
                                    updateMessage(assistantId, { id: parsed.messageId });
                                }
                                if (parsed.conversationId && !activeConversationId) {
                                    setActiveConversationId(parsed.conversationId);
                                    window.history.replaceState(null, "", `/chat/${parsed.conversationId}`);
                                }
                            } catch {
                                // Skip invalid JSON
                            }
                        }
                    }
                }
            }
        } catch (err: any) {
            if (err.name !== "AbortError") {
                updateMessage(assistantId, { content: "An error occurred while generating the response." });
            }
        } finally {
            setIsStreaming(false);
            abortRef.current = null;
        }
    }, [input, isStreaming, activeConversationId, messages, settings, addMessage, updateMessage, setIsStreaming, setActiveConversationId, conversations, setConversations]);

    function handleStop() {
        abortRef.current?.abort();
        setIsStreaming(false);
    }

    function handleKeyDown(e: React.KeyboardEvent) {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    }

    return (
        <div className="sticky bottom-0 pb-4 pt-2 px-4" style={{ background: "var(--bg-primary)" }}>
            <div
                className="max-w-3xl mx-auto relative rounded-2xl transition-all"
                style={{
                    background: "var(--bg-composer)",
                    border: "1px solid var(--border-default)",
                    boxShadow: "var(--shadow-composer)",
                }}
            >
                <div className="flex items-end gap-2 p-3">
                    {/* Attachment button */}
                    <button
                        className="p-2 rounded-lg transition-colors self-end flex-shrink-0 hover:opacity-80"
                        style={{ color: "var(--text-tertiary)" }}
                        aria-label="Attach files"
                    >
                        <Paperclip className="w-5 h-5" />
                    </button>

                    {/* Textarea */}
                    <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Message PomeGranate…"
                        rows={1}
                        className="flex-1 resize-none bg-transparent outline-none text-sm leading-relaxed py-2"
                        style={{
                            color: "var(--text-primary)",
                            maxHeight: "200px",
                            minHeight: "24px",
                        }}
                        disabled={isStreaming}
                        aria-label="Message input"
                    />

                    {/* Send / Stop */}
                    {isStreaming ? (
                        <button
                            onClick={handleStop}
                            className="p-2 rounded-full transition-all self-end flex-shrink-0"
                            style={{
                                background: "var(--text-primary)",
                                color: "var(--bg-primary)",
                            }}
                            aria-label="Stop generating"
                        >
                            <Square className="w-4 h-4" fill="currentColor" />
                        </button>
                    ) : (
                        <button
                            onClick={handleSend}
                            disabled={!input.trim()}
                            className="p-2 rounded-full transition-all self-end flex-shrink-0 disabled:opacity-30"
                            style={{
                                background: input.trim() ? "var(--text-primary)" : "var(--bg-tertiary)",
                                color: input.trim() ? "var(--bg-primary)" : "var(--text-tertiary)",
                            }}
                            aria-label="Send message"
                        >
                            <ArrowUp className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>

            {/* Hint */}
            <p
                className="text-center text-xs mt-2"
                style={{ color: "var(--text-tertiary)" }}
            >
                PomeGranate can make mistakes. Consider checking important information.
            </p>
        </div>
    );
}
