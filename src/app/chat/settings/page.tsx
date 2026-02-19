"use client";

import { ChatHeader } from "@/components/chat/chat-header";
import { useTheme } from "@/components/providers/theme-provider";
import { useChat } from "@/components/chat/chat-store";
import {
    Sun,
    Moon,
    Monitor,
    Download,
    Upload,
    Trash2,
    Brain,
    Loader2,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";

export default function SettingsPage() {
    const { theme, setTheme } = useTheme();
    const { settings, setSettings } = useChat();
    const [memories, setMemories] = useState<
        { id: string; content: string; createdAt: string }[]
    >([]);
    const [loadingMemories, setLoadingMemories] = useState(false);
    const [importResult, setImportResult] = useState<string>("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Load memories
    useEffect(() => {
        async function load() {
            setLoadingMemories(true);
            try {
                const res = await fetch("/api/memory");
                if (res.ok) setMemories(await res.json());
            } catch { }
            setLoadingMemories(false);
        }
        load();
    }, []);

    async function handleExport() {
        try {
            const res = await fetch("/api/chat/export", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({}),
            });
            const data = await res.json();
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `pomegranate-export-${new Date().toISOString().slice(0, 10)}.json`;
            a.click();
            URL.revokeObjectURL(url);
        } catch {
            alert("Export failed");
        }
    }

    async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        setImportResult("");
        try {
            const text = await file.text();
            const data = JSON.parse(text);

            const res = await fetch("/api/chat/import", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            const result = await res.json();
            if (res.ok) {
                setImportResult(
                    `Imported ${result.imported} conversation(s). ${result.failed ? `Failed: ${result.failed}` : ""}`
                );
            } else {
                setImportResult(`Error: ${result.error}`);
            }
        } catch {
            setImportResult("Failed to parse import file");
        }
        e.target.value = "";
    }

    async function handleDeleteMemory(id: string) {
        try {
            await fetch(`/api/memory?id=${id}`, { method: "DELETE" });
            setMemories((prev) => prev.filter((m) => m.id !== id));
        } catch { }
    }

    return (
        <>
            <ChatHeader />
            <div className="flex-1 overflow-y-auto">
                <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
                    <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
                        Settings
                    </h1>

                    {/* Theme */}
                    <section>
                        <h2 className="text-sm font-medium mb-3" style={{ color: "var(--text-secondary)" }}>
                            APPEARANCE
                        </h2>
                        <div className="flex gap-2">
                            {([
                                { value: "light", icon: Sun, label: "Light" },
                                { value: "dark", icon: Moon, label: "Dark" },
                                { value: "system", icon: Monitor, label: "System" },
                            ] as const).map(({ value, icon: Icon, label }) => (
                                <button
                                    key={value}
                                    onClick={() => { setTheme(value); setSettings({ theme: value }); }}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all"
                                    style={{
                                        background: theme === value ? "var(--accent-light)" : "var(--bg-secondary)",
                                        color: theme === value ? "var(--accent)" : "var(--text-secondary)",
                                        border: `1px solid ${theme === value ? "var(--accent)" : "var(--border-default)"}`,
                                    }}
                                >
                                    <Icon className="w-4 h-4" />
                                    {label}
                                </button>
                            ))}
                        </div>
                    </section>

                    {/* Model settings */}
                    <section>
                        <h2 className="text-sm font-medium mb-3" style={{ color: "var(--text-secondary)" }}>
                            MODEL
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm mb-1.5" style={{ color: "var(--text-primary)" }}>
                                    Default Model
                                </label>
                                <select
                                    value={settings.defaultModel}
                                    onChange={(e) => setSettings({ defaultModel: e.target.value })}
                                    className="w-full px-3 py-2.5 text-sm rounded-lg outline-none"
                                    style={{
                                        background: "var(--bg-secondary)",
                                        border: "1px solid var(--border-default)",
                                        color: "var(--text-primary)",
                                    }}
                                >
                                    <option value="gpt-4o">GPT-4o</option>
                                    <option value="gpt-4o-mini">GPT-4o mini</option>
                                    <option value="gpt-4-turbo">GPT-4 Turbo</option>
                                    <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                                    <option value="local">Local Model</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm mb-1.5" style={{ color: "var(--text-primary)" }}>
                                    System Prompt
                                </label>
                                <textarea
                                    value={settings.systemPrompt}
                                    onChange={(e) => setSettings({ systemPrompt: e.target.value })}
                                    rows={3}
                                    className="w-full px-3 py-2.5 text-sm rounded-lg outline-none resize-none"
                                    style={{
                                        background: "var(--bg-secondary)",
                                        border: "1px solid var(--border-default)",
                                        color: "var(--text-primary)",
                                    }}
                                />
                            </div>
                            <div>
                                <div className="flex justify-between mb-1.5">
                                    <label className="text-sm" style={{ color: "var(--text-primary)" }}>
                                        Temperature
                                    </label>
                                    <span className="text-sm font-mono" style={{ color: "var(--text-secondary)" }}>
                                        {settings.temperature}
                                    </span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="2"
                                    step="0.1"
                                    value={settings.temperature}
                                    onChange={(e) => setSettings({ temperature: parseFloat(e.target.value) })}
                                    className="w-full accent-[var(--accent)]"
                                />
                            </div>
                        </div>
                    </section>

                    {/* Import/Export */}
                    <section>
                        <h2 className="text-sm font-medium mb-3" style={{ color: "var(--text-secondary)" }}>
                            DATA
                        </h2>
                        <div className="flex gap-3">
                            <button
                                onClick={handleExport}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all"
                                style={{
                                    background: "var(--bg-secondary)",
                                    color: "var(--text-primary)",
                                    border: "1px solid var(--border-default)",
                                }}
                            >
                                <Download className="w-4 h-4" />
                                Export Chats
                            </button>
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all"
                                style={{
                                    background: "var(--bg-secondary)",
                                    color: "var(--text-primary)",
                                    border: "1px solid var(--border-default)",
                                }}
                            >
                                <Upload className="w-4 h-4" />
                                Import Chats
                            </button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".json"
                                className="hidden"
                                onChange={handleImport}
                            />
                        </div>
                        {importResult && (
                            <p className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>
                                {importResult}
                            </p>
                        )}
                    </section>

                    {/* Memory */}
                    <section>
                        <h2 className="text-sm font-medium mb-3 flex items-center gap-2" style={{ color: "var(--text-secondary)" }}>
                            <Brain className="w-4 h-4" />
                            MEMORY
                        </h2>
                        {loadingMemories ? (
                            <div className="flex items-center gap-2 py-4" style={{ color: "var(--text-tertiary)" }}>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Loading memories…
                            </div>
                        ) : memories.length === 0 ? (
                            <p className="text-sm py-4" style={{ color: "var(--text-tertiary)" }}>
                                No memory items yet. Memories will appear here as they are saved.
                            </p>
                        ) : (
                            <div className="space-y-2">
                                {memories.map((m) => (
                                    <div
                                        key={m.id}
                                        className="flex items-start gap-3 p-3 rounded-lg"
                                        style={{
                                            background: "var(--bg-secondary)",
                                            border: "1px solid var(--border-light)",
                                        }}
                                    >
                                        <p className="flex-1 text-sm" style={{ color: "var(--text-primary)" }}>
                                            {m.content}
                                        </p>
                                        <button
                                            onClick={() => handleDeleteMemory(m.id)}
                                            className="p-1.5 rounded-md flex-shrink-0 transition-colors hover:opacity-80"
                                            style={{ color: "var(--text-tertiary)" }}
                                            aria-label="Delete memory"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                </div>
            </div>
        </>
    );
}
