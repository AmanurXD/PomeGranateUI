"use client";

import { ChatProvider } from "@/components/chat/chat-store";
import { Sidebar } from "@/components/chat/sidebar";
import { SettingsModal } from "@/components/chat/settings-modal";
import { useEffect, useCallback } from "react";
import { useChat } from "@/components/chat/chat-store";

function ChatLayoutInner({ children }: { children: React.ReactNode }) {
    const { setConversations, toggleSidebar, setSettingsOpen, setSidebarOpen } = useChat();

    // Load conversations
    useEffect(() => {
        async function load() {
            try {
                const res = await fetch("/api/conversations");
                if (res.ok) {
                    const data = await res.json();
                    setConversations(data);
                }
            } catch (e) {
                console.error("Failed to load conversations:", e);
            }
        }
        load();
    }, [setConversations]);

    // Keyboard shortcuts
    const handleKeyboard = useCallback(
        (e: KeyboardEvent) => {
            // Ctrl/Cmd + Shift + L: toggle theme
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "L") {
                e.preventDefault();
                // Theme toggle is handled in sidebar menu
            }
            // Ctrl/Cmd + K: search
            if ((e.ctrlKey || e.metaKey) && e.key === "k") {
                e.preventDefault();
                setSidebarOpen(true);
                // Focus search input
                setTimeout(() => {
                    const searchInput = document.querySelector<HTMLInputElement>(
                        'input[aria-label="Search conversations"]'
                    );
                    searchInput?.focus();
                }, 100);
            }
            // Ctrl/Cmd + ,: settings
            if ((e.ctrlKey || e.metaKey) && e.key === ",") {
                e.preventDefault();
                setSettingsOpen(true);
            }
        },
        [setSidebarOpen, setSettingsOpen]
    );

    useEffect(() => {
        document.addEventListener("keydown", handleKeyboard);
        return () => document.removeEventListener("keydown", handleKeyboard);
    }, [handleKeyboard]);

    return (
        <div className="flex h-screen overflow-hidden" style={{ background: "var(--bg-primary)" }}>
            <Sidebar />
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {children}
            </main>
            <SettingsModal />
        </div>
    );
}

export default function ChatLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <ChatProvider>
            <ChatLayoutInner>{children}</ChatLayoutInner>
        </ChatProvider>
    );
}
