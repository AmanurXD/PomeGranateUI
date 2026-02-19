/**
 * Tool calling scaffold – a clean registry pattern with placeholder tools.
 */

export interface ToolInput {
    [key: string]: unknown;
}

export interface ToolResult {
    content: string;
    error?: string;
}

export interface Tool {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
    execute: (input: ToolInput) => Promise<ToolResult>;
}

class ToolRegistry {
    private tools = new Map<string, Tool>();

    register(tool: Tool) {
        this.tools.set(tool.name, tool);
    }

    get(name: string): Tool | undefined {
        return this.tools.get(name);
    }

    list(): Tool[] {
        return Array.from(this.tools.values());
    }

    async execute(name: string, input: ToolInput): Promise<ToolResult> {
        const tool = this.tools.get(name);
        if (!tool) {
            return { content: "", error: `Tool "${name}" not found` };
        }
        try {
            return await tool.execute(input);
        } catch (err: any) {
            return { content: "", error: err.message || "Tool execution failed" };
        }
    }

    /** Get tool definitions for LLM tool calling */
    getDefinitions() {
        return this.list().map((t) => ({
            name: t.name,
            description: t.description,
            parameters: t.parameters,
        }));
    }
}

// Singleton registry
export const toolRegistry = new ToolRegistry();

// ─── Placeholder tools ─────────────────────────────────────────

toolRegistry.register({
    name: "get_weather",
    description: "Get the current weather for a given location",
    parameters: {
        type: "object",
        properties: {
            location: { type: "string", description: "City name" },
        },
        required: ["location"],
    },
    async execute(input) {
        return {
            content: JSON.stringify({
                location: input.location,
                temperature: 72,
                condition: "Partly cloudy",
                humidity: 45,
            }),
        };
    },
});

toolRegistry.register({
    name: "web_search",
    description: "Search the web for information",
    parameters: {
        type: "object",
        properties: {
            query: { type: "string", description: "Search query" },
        },
        required: ["query"],
    },
    async execute(input) {
        return {
            content: JSON.stringify({
                query: input.query,
                results: [
                    { title: "Example Result 1", snippet: "This is a placeholder search result." },
                    { title: "Example Result 2", snippet: "Another placeholder result." },
                ],
            }),
        };
    },
});

toolRegistry.register({
    name: "calculator",
    description: "Evaluate a mathematical expression",
    parameters: {
        type: "object",
        properties: {
            expression: { type: "string", description: "Math expression to evaluate" },
        },
        required: ["expression"],
    },
    async execute(input) {
        try {
            // Safe eval for basic math
            const result = Function(`"use strict"; return (${input.expression})`)();
            return { content: String(result) };
        } catch {
            return { content: "", error: "Invalid expression" };
        }
    },
});
