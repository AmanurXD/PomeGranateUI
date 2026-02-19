import type { LLMAdapter, GenerateStreamOptions, EmbeddingOptions } from "./adapter";

/**
 * OpenAI-compatible adapter.
 * Works with OpenAI, Azure OpenAI, LocalAI, Ollama (with OpenAI compat), LM Studio, etc.
 */
export class OpenAIAdapter implements LLMAdapter {
    private apiKey: string;
    private baseUrl: string;

    constructor(apiKey?: string, baseUrl?: string) {
        this.apiKey = apiKey || process.env.OPENAI_API_KEY || "";
        this.baseUrl = (baseUrl || process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "");
    }

    async *generateStream(options: GenerateStreamOptions): AsyncIterable<string> {
        const body: Record<string, unknown> = {
            model: options.model,
            messages: options.messages,
            temperature: options.temperature ?? 0.7,
            max_tokens: options.maxTokens ?? 4096,
            stream: true,
        };

        if (options.tools?.length) {
            body.tools = options.tools.map((t) => ({
                type: "function",
                function: { name: t.name, description: t.description, parameters: t.parameters },
            }));
            body.tool_choice = options.toolChoice || "auto";
        }

        const res = await fetch(`${this.baseUrl}/chat/completions`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...(this.apiKey && { Authorization: `Bearer ${this.apiKey}` }),
            },
            body: JSON.stringify(body),
        });

        if (!res.ok) {
            const errText = await res.text().catch(() => "Unknown error");
            throw new Error(`LLM API error ${res.status}: ${errText}`);
        }

        const reader = res.body?.getReader();
        if (!reader) throw new Error("No response body");

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed || !trimmed.startsWith("data: ")) continue;
                const data = trimmed.slice(6);
                if (data === "[DONE]") return;

                try {
                    const parsed = JSON.parse(data);
                    const token = parsed.choices?.[0]?.delta?.content;
                    if (token) yield token;
                } catch {
                    // Skip invalid JSON chunks
                }
            }
        }
    }

    async createEmbeddings(options: EmbeddingOptions): Promise<number[][]> {
        const model = options.model || process.env.EMBEDDING_MODEL || "text-embedding-3-small";

        const res = await fetch(`${this.baseUrl}/embeddings`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...(this.apiKey && { Authorization: `Bearer ${this.apiKey}` }),
            },
            body: JSON.stringify({
                model,
                input: options.texts,
            }),
        });

        if (!res.ok) {
            const errText = await res.text().catch(() => "Unknown error");
            throw new Error(`Embeddings API error ${res.status}: ${errText}`);
        }

        const json = await res.json();
        return json.data.map((d: { embedding: number[] }) => d.embedding);
    }
}

/** Factory to get the right adapter */
export function createLLMAdapter(provider?: string, baseUrl?: string): LLMAdapter {
    // All providers use OpenAI-compatible API, just different base URLs
    if (baseUrl) {
        return new OpenAIAdapter("", baseUrl);
    }
    return new OpenAIAdapter();
}
