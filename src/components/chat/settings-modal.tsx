"use client";

import { useChat } from "@/components/chat/chat-store";
import { useTheme } from "@/components/providers/theme-provider";
import { X, Sun, Moon, Monitor } from "lucide-react";
import { useEffect, useRef } from "react";

export function SettingsModal() {
    const { isSettingsOpen, setSettingsOpen, settings, setSettings } = useChat();
    const { theme, setTheme } = useTheme();
    const overlayRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleKey(e: KeyboardEvent) {
            if (e.key === "Escape") setSettingsOpen(false);
        }
        if (isSettingsOpen) {
            document.addEventListener("keydown", handleKey);
            return () => document.removeEventListener("keydown", handleKey);
        }
    }, [isSettingsOpen, setSettingsOpen]);

    if (!isSettingsOpen) return null;

    return (
        <div
            ref={overlayRef}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "var(--bg-overlay)" }}
            onClick={(e) => {
                if (e.target === overlayRef.current) setSettingsOpen(false);
            }}
        >
            <div
                className="w-full max-w-lg rounded-2xl overflow-hidden animate-fade-in"
                style={{
                    background: "var(--bg-primary)",
                    border: "1px solid var(--border-default)",
                    boxShadow: "var(--shadow-lg)",
                }}
                role="dialog"
                aria-label="Settings"
            >
                {/* Header */}
                <div
                    className="flex items-center justify-between px-6 py-4"
                    style={{ borderBottom: "1px solid var(--border-light)" }}
                >
                    <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
                        Settings
                    </h2>
                    <button
                        onClick={() => setSettingsOpen(false)}
                        className="p-1.5 rounded-lg transition-colors hover:opacity-80"
                        style={{ color: "var(--text-tertiary)" }}
                        aria-label="Close settings"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="px-6 py-5 space-y-6 max-h-[70vh] overflow-y-auto">
                    {/* Theme */}
                    <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-primary)" }}>
                            Theme
                        </label>
                        <div className="flex gap-2">
                            {([
                                { value: "light", icon: Sun, label: "Light" },
                                { value: "dark", icon: Moon, label: "Dark" },
                                { value: "system", icon: Monitor, label: "System" },
                            ] as const).map(({ value, icon: Icon, label }) => (
                                <button
                                    key={value}
                                    onClick={() => { setTheme(value); setSettings({ theme: value }); }}
                                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all"
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
                    </div>

                    {/* Default Model */}
                    <div>
                        <label htmlFor="model" className="block text-sm font-medium mb-2" style={{ color: "var(--text-primary)" }}>
                            Default Model
                        </label>
                        <select
                            id="model"
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

                    {/* System Prompt */}
                    <div>
                        <label htmlFor="systemPrompt" className="block text-sm font-medium mb-2" style={{ color: "var(--text-primary)" }}>
                            System Prompt
                        </label>
                        <textarea
                            id="systemPrompt"
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

                    {/* Temperature */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label htmlFor="temperature" className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                                Temperature
                            </label>
                            <span className="text-sm font-mono" style={{ color: "var(--text-secondary)" }}>
                                {settings.temperature}
                            </span>
                        </div>
                        <input
                            id="temperature"
                            type="range"
                            min="0"
                            max="2"
                            step="0.1"
                            value={settings.temperature}
                            onChange={(e) => setSettings({ temperature: parseFloat(e.target.value) })}
                            className="w-full accent-[var(--accent)]"
                        />
                        <div className="flex justify-between text-xs mt-1" style={{ color: "var(--text-tertiary)" }}>
                            <span>Precise</span>
                            <span>Creative</span>
                        </div>
                    </div>

                    {/* Max Tokens */}
                    <div>
                        <label htmlFor="maxTokens" className="block text-sm font-medium mb-2" style={{ color: "var(--text-primary)" }}>
                            Max Tokens
                        </label>
                        <input
                            id="maxTokens"
                            type="number"
                            min={256}
                            max={128000}
                            step={256}
                            value={settings.maxTokens}
                            onChange={(e) => setSettings({ maxTokens: parseInt(e.target.value) || 4096 })}
                            className="w-full px-3 py-2.5 text-sm rounded-lg outline-none"
                            style={{
                                background: "var(--bg-secondary)",
                                border: "1px solid var(--border-default)",
                                color: "var(--text-primary)",
                            }}
                        />
                    </div>
                </div>

                {/* Footer */}
                <div
                    className="flex justify-end px-6 py-4"
                    style={{ borderTop: "1px solid var(--border-light)" }}
                >
                    <button
                        onClick={() => setSettingsOpen(false)}
                        className="px-4 py-2 text-sm font-medium rounded-lg transition-all"
                        style={{
                            background: "var(--accent)",
                            color: "var(--text-inverse)",
                        }}
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
}
