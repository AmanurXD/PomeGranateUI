/* ─── Shared types ─────────────────────────────────────────────────── */

export type Role = "user" | "assistant" | "system" | "tool";

export interface ChatMessage {
    id: string;
    conversationId: string;
    role: Role;
    content: string;
    parentId?: string | null;
    metadata?: MessageMetadata | null;
    createdAt: string;
    versions?: MessageVersionItem[];
    feedback?: FeedbackItem | null;
}

export interface MessageMetadata {
    model?: string;
    promptTokens?: number;
    completionTokens?: number;
    sources?: RetrievedSource[];
    toolCalls?: ToolCall[];
}

export interface MessageVersionItem {
    id: string;
    versionIndex: number;
    content: string;
    metadata?: MessageMetadata | null;
    createdAt: string;
}

export interface FeedbackItem {
    id: string;
    rating: number;
    note?: string | null;
}

export interface ConversationItem {
    id: string;
    title: string;
    isArchived: boolean;
    isPinned: boolean;
    model?: string | null;
    updatedAt: string;
    createdAt: string;
}

export interface RetrievedSource {
    documentId: string;
    documentTitle: string;
    chunkIndex: number;
    content: string;
    score: number;
}

export interface ToolCall {
    id: string;
    name: string;
    arguments: Record<string, unknown>;
    result?: string;
}

export interface ModelConfig {
    id: string;
    name: string;
    provider: string;
    maxTokens: number;
    supportsStreaming: boolean;
    supportsTools: boolean;
}

export interface UserSettings {
    theme: "light" | "dark" | "system";
    defaultModel: string;
    systemPrompt: string;
    temperature: number;
    maxTokens: number;
}

export interface StreamPayload {
    conversationId?: string;
    messages: { role: Role; content: string }[];
    model?: string;
    temperature?: number;
    maxTokens?: number;
    systemPrompt?: string;
    enableRag?: boolean;
    topK?: number;
}
