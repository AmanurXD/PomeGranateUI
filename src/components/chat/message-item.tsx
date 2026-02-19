"use client";

import { ChatMessage } from "@/types";
import { useChat } from "@/components/chat/chat-store";
import { copyToClipboard } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
    Copy,
    Check,
    RefreshCw,
    ThumbsUp,
    ThumbsDown,
    Pencil,
    ChevronDown,
    ChevronUp,
    Bot,
    User,
} from "lucide-react";
import { useState } from "react";

interface Props {
    message: ChatMessage;
    isLast: boolean;
}

export function MessageItem({ message, isLast }: Props) {
    const { isStreaming } = useChat();
    const [copied, setCopied] = useState(false);
    const [showSources, setShowSources] = useState(false);
    const [feedbackGiven, setFeedbackGiven] = useState<"up" | "down" | null>(
        message.feedback?.rating === 1
            ? "up"
            : message.feedback?.rating === -1
                ? "down"
                : null
    );
    const isUser = message.role === "user";
    const isAssistant = message.role === "assistant";
    const sources = message.metadata?.sources;

    async function handleCopy() {
        await copyToClipboard(message.content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }

    async function handleFeedback(rating: number) {
        const type = rating === 1 ? "up" : "down";
        setFeedbackGiven(feedbackGiven === type ? null : type);
        try {
            await fetch("/api/messages/feedback", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    messageId: message.id,
                    rating: feedbackGiven === type ? 0 : rating,
                }),
            });
        } catch (e) {
            console.error("Feedback failed:", e);
        }
    }

    return (
        <div className="group py-5 animate-fade-in" style={{ borderBottom: "1px solid var(--border-light)" }}>
            <div className="flex gap-4">
                {/* Avatar */}
                <div
                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-medium"
                    style={{
                        background: isUser ? "var(--bg-tertiary)" : "var(--accent)",
                        color: isUser ? "var(--text-primary)" : "var(--text-inverse)",
                    }}
                >
                    {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    {/* Role label */}
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                            {isUser ? "You" : "Assistant"}
                        </span>
                        {isAssistant && message.metadata?.model && (
                            <span
                                className="text-xs px-1.5 py-0.5 rounded"
                                style={{ background: "var(--bg-tertiary)", color: "var(--text-tertiary)" }}
                            >
                                {message.metadata.model}
                            </span>
                        )}
                    </div>

                    {/* Message content */}
                    <div
                        className="markdown-body text-sm leading-relaxed"
                        style={{ color: "var(--text-primary)" }}
                    >
                        {isAssistant ? (
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {message.content}
                            </ReactMarkdown>
                        ) : (
                            <p className="whitespace-pre-wrap">{message.content}</p>
                        )}
                    </div>

                    {/* Sources */}
                    {isAssistant && sources && sources.length > 0 && (
                        <div className="mt-3">
                            <button
                                onClick={() => setShowSources(!showSources)}
                                className="flex items-center gap-1.5 text-xs font-medium transition-colors"
                                style={{ color: "var(--accent)" }}
                            >
                                {showSources ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                {sources.length} source{sources.length > 1 ? "s" : ""}
                            </button>
                            {showSources && (
                                <div className="mt-2 space-y-2 animate-fade-in">
                                    {sources.map((src, i) => (
                                        <div
                                            key={i}
                                            className="p-3 rounded-lg text-xs"
                                            style={{
                                                background: "var(--bg-secondary)",
                                                border: "1px solid var(--border-light)",
                                            }}
                                        >
                                            <div className="font-medium mb-1" style={{ color: "var(--text-primary)" }}>
                                                {src.documentTitle}
                                            </div>
                                            <p style={{ color: "var(--text-secondary)" }}>
                                                {src.content.slice(0, 200)}…
                                            </p>
                                            <span className="mt-1 inline-block" style={{ color: "var(--text-tertiary)" }}>
                                                Score: {(src.score * 100).toFixed(0)}%
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                            onClick={handleCopy}
                            className="p-1.5 rounded-md transition-colors"
                            style={{ color: "var(--text-tertiary)" }}
                            aria-label="Copy message"
                        >
                            {copied ? <Check className="w-3.5 h-3.5" style={{ color: "var(--success)" }} /> : <Copy className="w-3.5 h-3.5" />}
                        </button>

                        {isAssistant && (
                            <>
                                <button
                                    onClick={() => handleFeedback(1)}
                                    className="p-1.5 rounded-md transition-colors"
                                    style={{ color: feedbackGiven === "up" ? "var(--success)" : "var(--text-tertiary)" }}
                                    aria-label="Thumbs up"
                                >
                                    <ThumbsUp className="w-3.5 h-3.5" />
                                </button>
                                <button
                                    onClick={() => handleFeedback(-1)}
                                    className="p-1.5 rounded-md transition-colors"
                                    style={{ color: feedbackGiven === "down" ? "var(--error)" : "var(--text-tertiary)" }}
                                    aria-label="Thumbs down"
                                >
                                    <ThumbsDown className="w-3.5 h-3.5" />
                                </button>
                                {isLast && !isStreaming && (
                                    <button
                                        className="p-1.5 rounded-md transition-colors"
                                        style={{ color: "var(--text-tertiary)" }}
                                        aria-label="Regenerate"
                                    >
                                        <RefreshCw className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
