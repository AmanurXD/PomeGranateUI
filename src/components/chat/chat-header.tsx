"use client";

import { useChat } from "@/components/chat/chat-store";
import {
    PanelLeftOpen,
    ChevronDown,
    Share2,
    Download,
    MoreHorizontal,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";

const MODELS = [
    { id: "gpt-4o", name: "GPT-4o", provider: "openai" },
    { id: "gpt-4o-mini", name: "GPT-4o mini", provider: "openai" },
    { id: "gpt-4-turbo", name: "GPT-4 Turbo", provider: "openai" },
    { id: "gpt-3.5-turbo", name: "GPT-3.5 Turbo", provider: "openai" },
    { id: "local", name: "Local Model", provider: "local" },
];

export function ChatHeader() {
    const {
        isSidebarOpen,
        toggleSidebar,
        settings,
        setSettings,
        activeConversationId,
        conversations,
        resetChat,
    } = useChat();
    const [showModelMenu, setShowModelMenu] = useState(false);
    const modelRef = useRef<HTMLDivElement>(null);

    const activeConversation = conversations.find(
        (c) => c.id === activeConversationId
    );
    const currentModel = MODELS.find((m) => m.id === settings.defaultModel) || MODELS[0];

    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (modelRef.current && !modelRef.current.contains(e.target as Node)) {
                setShowModelMenu(false);
            }
        }
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    return (
        <header
            className="sticky top-0 z-20 flex items-center justify-between px-4 h-14 flex-shrink-0"
            style={{
                background: "var(--bg-primary)",
                borderBottom: "1px solid var(--border-light)",
            }}
        >
            <div className="flex items-center gap-2">
                {!isSidebarOpen && (
                    <>
                        <button
                            onClick={toggleSidebar}
                            className="p-2 rounded-lg transition-colors hover:opacity-80"
                            style={{ color: "var(--text-secondary)" }}
                            aria-label="Open sidebar"
                        >
                            <PanelLeftOpen className="w-5 h-5" />
                        </button>
                        <button
                            onClick={resetChat}
                            className="p-2 rounded-lg transition-colors hover:opacity-80"
                            style={{ color: "var(--text-secondary)" }}
                            aria-label="New chat"
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 5v14M5 12h14" />
                            </svg>
                        </button>
                    </>
                )}

                {/* Model selector */}
                <div className="relative" ref={modelRef}>
                    <button
                        onClick={() => setShowModelMenu(!showModelMenu)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors hover:opacity-80"
                        style={{ color: "var(--text-primary)" }}
                    >
                        {currentModel.name}
                        <ChevronDown className="w-3.5 h-3.5" style={{ color: "var(--text-tertiary)" }} />
                    </button>

                    {showModelMenu && (
                        <div
                            className="absolute top-full left-0 mt-1 w-56 rounded-xl py-1.5 z-50 animate-fade-in"
                            style={{
                                background: "var(--bg-primary)",
                                border: "1px solid var(--border-default)",
                                boxShadow: "var(--shadow-lg)",
                            }}
                        >
                            {MODELS.map((model) => (
                                <button
                                    key={model.id}
                                    onClick={() => {
                                        setSettings({ defaultModel: model.id });
                                        setShowModelMenu(false);
                                    }}
                                    className="w-full flex items-center justify-between px-3 py-2.5 text-sm transition-colors hover:opacity-80 rounded-lg mx-0"
                                    style={{
                                        color: model.id === settings.defaultModel ? "var(--accent)" : "var(--text-primary)",
                                        background: model.id === settings.defaultModel ? "var(--accent-light)" : "transparent",
                                    }}
                                >
                                    <span>{model.name}</span>
                                    <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                                        {model.provider}
                                    </span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-1">
                {activeConversationId && (
                    <>
                        <button
                            className="p-2 rounded-lg transition-colors hover:opacity-80"
                            style={{ color: "var(--text-secondary)" }}
                            aria-label="Share conversation"
                        >
                            <Share2 className="w-4.5 h-4.5" />
                        </button>
                        <button
                            className="p-2 rounded-lg transition-colors hover:opacity-80"
                            style={{ color: "var(--text-secondary)" }}
                            aria-label="Export conversation"
                        >
                            <Download className="w-4.5 h-4.5" />
                        </button>
                    </>
                )}
            </div>
        </header>
    );
}
