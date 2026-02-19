"use client";

import { useChat } from "@/components/chat/chat-store";
import { ConversationList } from "@/components/chat/conversation-list";
import { useSession, signOut } from "next-auth/react";
import { useTheme } from "@/components/providers/theme-provider";
import { useRouter } from "next/navigation";
import {
    Plus,
    Search,
    Settings,
    LogOut,
    Moon,
    Sun,
    Monitor,
    PanelLeftClose,
    X,
    User,
    ChevronDown,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";

export function Sidebar() {
    const { data: session } = useSession();
    const { theme, setTheme } = useTheme();
    const {
        isSidebarOpen,
        toggleSidebar,
        setSidebarOpen,
        searchQuery,
        setSearchQuery,
        setSettingsOpen,
        resetChat,
    } = useChat();
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [showThemeMenu, setShowThemeMenu] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    // Close menus on click outside
    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setShowUserMenu(false);
                setShowThemeMenu(false);
            }
        }
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    return (
        <>
            {/* Mobile backdrop */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 z-30 md:hidden"
                    style={{ background: "var(--bg-overlay)" }}
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            <aside
                className={`
          fixed md:relative z-40 flex flex-col h-full
          transition-all duration-300 ease-in-out
          ${isSidebarOpen ? "translate-x-0" : "-translate-x-full md:-translate-x-full"}
        `}
                style={{
                    width: "var(--sidebar-width)",
                    minWidth: "var(--sidebar-width)",
                    background: "var(--bg-sidebar)",
                    borderRight: "1px solid var(--border-light)",
                }}
                role="navigation"
                aria-label="Sidebar"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-3 h-14">
                    <button
                        onClick={toggleSidebar}
                        className="p-2 rounded-lg transition-colors hover:opacity-80"
                        style={{ color: "var(--text-secondary)" }}
                        aria-label="Close sidebar"
                    >
                        <PanelLeftClose className="w-5 h-5" />
                    </button>

                    <button
                        onClick={() => resetChat()}
                        className="p-2 rounded-lg transition-colors hover:opacity-80"
                        style={{ color: "var(--text-secondary)" }}
                        aria-label="New chat"
                    >
                        <Plus className="w-5 h-5" />
                    </button>
                </div>

                {/* Search */}
                <div className="px-3 mb-2">
                    <div className="relative">
                        <Search
                            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                            style={{ color: "var(--text-tertiary)" }}
                        />
                        <input
                            type="text"
                            placeholder="Search conversations…"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-8 py-2 text-sm rounded-lg outline-none transition-all"
                            style={{
                                background: "var(--bg-hover)",
                                color: "var(--text-primary)",
                                border: "1px solid transparent",
                            }}
                            aria-label="Search conversations"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery("")}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded"
                                style={{ color: "var(--text-tertiary)" }}
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Conversations */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden px-2">
                    <ConversationList />
                </div>

                {/* User footer */}
                <div className="border-t p-2" style={{ borderColor: "var(--border-light)" }} ref={menuRef}>
                    {/* User menu popup */}
                    {showUserMenu && (
                        <div
                            className="absolute bottom-16 left-2 right-2 rounded-xl py-1 z-50 animate-fade-in"
                            style={{
                                background: "var(--bg-primary)",
                                border: "1px solid var(--border-default)",
                                boxShadow: "var(--shadow-lg)",
                            }}
                        >
                            {/* Theme submenu */}
                            <div className="relative">
                                <button
                                    onClick={() => setShowThemeMenu(!showThemeMenu)}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm transition-colors hover:opacity-80 rounded-lg"
                                    style={{ color: "var(--text-primary)" }}
                                >
                                    {theme === "dark" ? <Moon className="w-4 h-4" /> : theme === "light" ? <Sun className="w-4 h-4" /> : <Monitor className="w-4 h-4" />}
                                    Theme
                                    <ChevronDown className="w-3.5 h-3.5 ml-auto" />
                                </button>
                                {showThemeMenu && (
                                    <div
                                        className="mx-2 mb-1 rounded-lg overflow-hidden"
                                        style={{ background: "var(--bg-secondary)" }}
                                    >
                                        {(["light", "dark", "system"] as const).map((t) => (
                                            <button
                                                key={t}
                                                onClick={() => { setTheme(t); setShowThemeMenu(false); }}
                                                className="w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors capitalize hover:opacity-80"
                                                style={{
                                                    color: theme === t ? "var(--accent)" : "var(--text-secondary)",
                                                    background: theme === t ? "var(--accent-light)" : "transparent",
                                                }}
                                            >
                                                {t === "light" && <Sun className="w-3.5 h-3.5" />}
                                                {t === "dark" && <Moon className="w-3.5 h-3.5" />}
                                                {t === "system" && <Monitor className="w-3.5 h-3.5" />}
                                                {t}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={() => { router.push("/chat/settings"); setShowUserMenu(false); }}
                                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm transition-colors hover:opacity-80 rounded-lg"
                                style={{ color: "var(--text-primary)" }}
                            >
                                <Settings className="w-4 h-4" />
                                Settings
                            </button>

                            <div className="border-t my-1" style={{ borderColor: "var(--border-light)" }} />

                            <button
                                onClick={() => signOut({ callbackUrl: "/login" })}
                                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm transition-colors hover:opacity-80 rounded-lg"
                                style={{ color: "var(--error)" }}
                            >
                                <LogOut className="w-4 h-4" />
                                Log out
                            </button>
                        </div>
                    )}

                    {/* User button */}
                    <button
                        onClick={() => { setShowUserMenu(!showUserMenu); setShowThemeMenu(false); }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors hover:opacity-90"
                        style={{ background: showUserMenu ? "var(--bg-hover)" : "transparent" }}
                    >
                        <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0"
                            style={{ background: "var(--accent)", color: "var(--text-inverse)" }}
                        >
                            {session?.user?.name?.[0]?.toUpperCase() || <User className="w-4 h-4" />}
                        </div>
                        <span
                            className="text-sm font-medium truncate text-left flex-1"
                            style={{ color: "var(--text-primary)" }}
                        >
                            {session?.user?.name || session?.user?.email || "User"}
                        </span>
                    </button>
                </div>
            </aside>
        </>
    );
}
