"use client";

import { useChat } from "@/components/chat/chat-store";
import { useRouter } from "next/navigation";
import { formatDate, truncate } from "@/lib/utils";
import { MessageSquare, Pin, MoreHorizontal, Pencil, Trash2, Archive } from "lucide-react";
import { useState, useRef, useEffect } from "react";

export function ConversationList() {
    const {
        conversations,
        activeConversationId,
        setActiveConversationId,
        searchQuery,
        setConversations,
        setSidebarOpen,
    } = useChat();
    const router = useRouter();

    const filtered = conversations.filter((c) =>
        c.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const pinned = filtered.filter((c) => c.isPinned && !c.isArchived);
    const recent = filtered.filter((c) => !c.isPinned && !c.isArchived);

    function handleSelect(id: string) {
        setActiveConversationId(id);
        router.push(`/chat/${id}`);
        // Close sidebar on mobile
        if (window.innerWidth < 768) setSidebarOpen(false);
    }

    async function handleDelete(id: string) {
        try {
            await fetch(`/api/conversations/${id}`, { method: "DELETE" });
            setConversations(conversations.filter((c) => c.id !== id));
            if (activeConversationId === id) {
                router.push("/chat");
            }
        } catch (e) {
            console.error("Delete failed:", e);
        }
    }

    async function handleRename(id: string, title: string) {
        try {
            await fetch(`/api/conversations/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title }),
            });
            setConversations(
                conversations.map((c) => (c.id === id ? { ...c, title } : c))
            );
        } catch (e) {
            console.error("Rename failed:", e);
        }
    }

    async function handleTogglePin(id: string, isPinned: boolean) {
        try {
            await fetch(`/api/conversations/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isPinned: !isPinned }),
            });
            setConversations(
                conversations.map((c) =>
                    c.id === id ? { ...c, isPinned: !isPinned } : c
                )
            );
        } catch (e) {
            console.error("Pin toggle failed:", e);
        }
    }

    if (filtered.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 px-4">
                <MessageSquare
                    className="w-8 h-8 mb-3"
                    style={{ color: "var(--text-tertiary)" }}
                />
                <p className="text-sm text-center" style={{ color: "var(--text-tertiary)" }}>
                    {searchQuery ? "No conversations found" : "No conversations yet"}
                </p>
                {!searchQuery && (
                    <p className="text-xs mt-1 text-center" style={{ color: "var(--text-tertiary)" }}>
                        Start a new chat to begin
                    </p>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-1">
            {pinned.length > 0 && (
                <div>
                    <p className="px-3 py-1.5 text-xs font-medium uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>
                        Pinned
                    </p>
                    {pinned.map((c) => (
                        <ConversationItem
                            key={c.id}
                            conversation={c}
                            isActive={c.id === activeConversationId}
                            onSelect={handleSelect}
                            onDelete={handleDelete}
                            onRename={handleRename}
                            onTogglePin={handleTogglePin}
                        />
                    ))}
                </div>
            )}
            {recent.length > 0 && (
                <div>
                    {pinned.length > 0 && (
                        <p className="px-3 py-1.5 text-xs font-medium uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>
                            Recent
                        </p>
                    )}
                    {recent.map((c) => (
                        <ConversationItem
                            key={c.id}
                            conversation={c}
                            isActive={c.id === activeConversationId}
                            onSelect={handleSelect}
                            onDelete={handleDelete}
                            onRename={handleRename}
                            onTogglePin={handleTogglePin}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

interface ConversationItemProps {
    conversation: {
        id: string;
        title: string;
        isPinned: boolean;
        updatedAt: string;
    };
    isActive: boolean;
    onSelect: (id: string) => void;
    onDelete: (id: string) => void;
    onRename: (id: string, title: string) => void;
    onTogglePin: (id: string, isPinned: boolean) => void;
}

function ConversationItem({
    conversation,
    isActive,
    onSelect,
    onDelete,
    onRename,
    onTogglePin,
}: ConversationItemProps) {
    const [showMenu, setShowMenu] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState(conversation.title);
    const menuRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isEditing && inputRef.current) inputRef.current.focus();
    }, [isEditing]);

    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setShowMenu(false);
            }
        }
        if (showMenu) {
            document.addEventListener("mousedown", handleClick);
            return () => document.removeEventListener("mousedown", handleClick);
        }
    }, [showMenu]);

    function handleSaveRename() {
        if (editTitle.trim() && editTitle !== conversation.title) {
            onRename(conversation.id, editTitle.trim());
        }
        setIsEditing(false);
    }

    return (
        <div className="relative group">
            <button
                onClick={() => !isEditing && onSelect(conversation.id)}
                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-left transition-all text-sm"
                style={{
                    background: isActive ? "var(--bg-active)" : "transparent",
                    color: "var(--text-primary)",
                }}
                onMouseEnter={(e) => {
                    if (!isActive) (e.currentTarget as HTMLElement).style.background = "var(--bg-hover)";
                }}
                onMouseLeave={(e) => {
                    if (!isActive) (e.currentTarget as HTMLElement).style.background = "transparent";
                }}
            >
                {conversation.isPinned && (
                    <Pin className="w-3 h-3 flex-shrink-0" style={{ color: "var(--accent)" }} />
                )}
                {isEditing ? (
                    <input
                        ref={inputRef}
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onBlur={handleSaveRename}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") handleSaveRename();
                            if (e.key === "Escape") { setIsEditing(false); setEditTitle(conversation.title); }
                        }}
                        className="flex-1 bg-transparent outline-none text-sm"
                        style={{ color: "var(--text-primary)" }}
                        onClick={(e) => e.stopPropagation()}
                    />
                ) : (
                    <span className="flex-1 truncate">{truncate(conversation.title, 30)}</span>
                )}
            </button>

            {/* Hover actions */}
            {!isEditing && (
                <div
                    className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                    ref={menuRef}
                >
                    <button
                        onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
                        className="p-1.5 rounded-md transition-colors"
                        style={{ color: "var(--text-tertiary)", background: "var(--bg-hover)" }}
                        aria-label="More actions"
                    >
                        <MoreHorizontal className="w-4 h-4" />
                    </button>

                    {showMenu && (
                        <div
                            className="absolute right-0 top-full mt-1 w-40 rounded-xl py-1 z-50 animate-fade-in"
                            style={{
                                background: "var(--bg-primary)",
                                border: "1px solid var(--border-default)",
                                boxShadow: "var(--shadow-lg)",
                            }}
                        >
                            <button
                                onClick={() => { setIsEditing(true); setShowMenu(false); }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors hover:opacity-80"
                                style={{ color: "var(--text-primary)" }}
                            >
                                <Pencil className="w-3.5 h-3.5" /> Rename
                            </button>
                            <button
                                onClick={() => { onTogglePin(conversation.id, conversation.isPinned); setShowMenu(false); }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors hover:opacity-80"
                                style={{ color: "var(--text-primary)" }}
                            >
                                <Pin className="w-3.5 h-3.5" /> {conversation.isPinned ? "Unpin" : "Pin"}
                            </button>
                            <div className="border-t my-1" style={{ borderColor: "var(--border-light)" }} />
                            <button
                                onClick={() => { onDelete(conversation.id); setShowMenu(false); }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors hover:opacity-80"
                                style={{ color: "var(--error)" }}
                            >
                                <Trash2 className="w-3.5 h-3.5" /> Delete
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
