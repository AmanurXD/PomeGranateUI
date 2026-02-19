"use client";

import {
    createContext,
    useContext,
    useState,
    useCallback,
    ReactNode,
} from "react";
import type { ConversationItem, ChatMessage, UserSettings } from "@/types";

interface ChatState {
    conversations: ConversationItem[];
    activeConversationId: string | null;
    messages: ChatMessage[];
    isStreaming: boolean;
    isSidebarOpen: boolean;
    isSettingsOpen: boolean;
    isSourcesPanelOpen: boolean;
    searchQuery: string;
    settings: UserSettings;
}

interface ChatContextType extends ChatState {
    setConversations: (convs: ConversationItem[]) => void;
    setActiveConversationId: (id: string | null) => void;
    setMessages: (msgs: ChatMessage[]) => void;
    addMessage: (msg: ChatMessage) => void;
    updateMessage: (id: string, partial: Partial<ChatMessage>) => void;
    setIsStreaming: (v: boolean) => void;
    toggleSidebar: () => void;
    setSidebarOpen: (v: boolean) => void;
    setSettingsOpen: (v: boolean) => void;
    setSourcesPanelOpen: (v: boolean) => void;
    setSearchQuery: (q: string) => void;
    setSettings: (s: Partial<UserSettings>) => void;
    resetChat: () => void;
}

const defaultSettings: UserSettings = {
    theme: "system",
    defaultModel: "gpt-4o-mini",
    systemPrompt: "You are a helpful assistant.",
    temperature: 0.7,
    maxTokens: 4096,
};

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
    const [conversations, setConversations] = useState<ConversationItem[]>([]);
    const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isStreaming, setIsStreaming] = useState(false);
    const [isSidebarOpen, setSidebarOpen] = useState(true);
    const [isSettingsOpen, setSettingsOpen] = useState(false);
    const [isSourcesPanelOpen, setSourcesPanelOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [settings, setSettingsState] = useState<UserSettings>(defaultSettings);

    const addMessage = useCallback((msg: ChatMessage) => {
        setMessages((prev) => [...prev, msg]);
    }, []);

    const updateMessage = useCallback(
        (id: string, partial: Partial<ChatMessage>) => {
            setMessages((prev) =>
                prev.map((m) => (m.id === id ? { ...m, ...partial } : m))
            );
        },
        []
    );

    const toggleSidebar = useCallback(() => {
        setSidebarOpen((prev) => !prev);
    }, []);

    const resetChat = useCallback(() => {
        setActiveConversationId(null);
        setMessages([]);
    }, []);

    const setSettings = useCallback((s: Partial<UserSettings>) => {
        setSettingsState((prev) => ({ ...prev, ...s }));
    }, []);

    return (
        <ChatContext.Provider
            value={{
                conversations,
                activeConversationId,
                messages,
                isStreaming,
                isSidebarOpen,
                isSettingsOpen,
                isSourcesPanelOpen,
                searchQuery,
                settings,
                setConversations,
                setActiveConversationId,
                setMessages,
                addMessage,
                updateMessage,
                setIsStreaming,
                toggleSidebar,
                setSidebarOpen,
                setSettingsOpen,
                setSourcesPanelOpen,
                setSearchQuery,
                setSettings,
                resetChat,
            }}
        >
            {children}
        </ChatContext.Provider>
    );
}

export function useChat() {
    const ctx = useContext(ChatContext);
    if (!ctx) throw new Error("useChat must be used within ChatProvider");
    return ctx;
}
