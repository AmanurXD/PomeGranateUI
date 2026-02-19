/* LLM adapter – provider-agnostic interface */

export interface LLMMessage {
    role: "user" | "assistant" | "system" | "tool";
    content: string;
    name?: string;
    tool_call_id?: string;
}

export interface GenerateStreamOptions {
    messages: LLMMessage[];
    model: string;
    temperature?: number;
    maxTokens?: number;
    tools?: ToolDefinition[];
    toolChoice?: "auto" | "none" | string;
}

export interface ToolDefinition {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
}

export interface EmbeddingOptions {
    texts: string[];
    model?: string;
}

export interface LLMAdapter {
    generateStream(options: GenerateStreamOptions): AsyncIterable<string>;
    createEmbeddings(options: EmbeddingOptions): Promise<number[][]>;
}

export type LLMProvider = "openai" | "local";
