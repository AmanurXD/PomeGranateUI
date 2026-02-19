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
    Radio,
    Copy,
    Check,
    RefreshCw,
    Unplug,
    Link,
    ExternalLink,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";

export default function SettingsPage() {
    const { theme, setTheme } = useTheme();
    const { settings, setSettings, frpStatus, setFrpStatus } = useChat();
    const [memories, setMemories] = useState<
        { id: string; content: string; createdAt: string }[]
    >([]);
    const [loadingMemories, setLoadingMemories] = useState(false);
    const [importResult, setImportResult] = useState<string>("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Remote LLM state
    const [notebookCells, setNotebookCells] = useState<{
        kaggleCell: string;
        colabCell: string;
    } | null>(null);
    const [activeTab, setActiveTab] = useState<"kaggle" | "colab">("kaggle");
    const [copied, setCopied] = useState<string | null>(null);
    const [tunnelUrl, setTunnelUrl] = useState("");
    const [frpLabel, setFrpLabel] = useState("My Remote LLM");
    const [frpModelName, setFrpModelName] = useState("");
    const [connecting, setConnecting] = useState(false);
    const [healthChecking, setHealthChecking] = useState(false);
    const [showCells, setShowCells] = useState(false);
    const [loadingCells, setLoadingCells] = useState(false);

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

    // Sync local form fields with global frpStatus
    useEffect(() => {
        if (frpStatus.configured) {
            setFrpLabel(frpStatus.label);
            setFrpModelName(frpStatus.modelName);
            if (frpStatus.tunnelUrl) setTunnelUrl(frpStatus.tunnelUrl);
        }
    }, [frpStatus.configured, frpStatus.label, frpStatus.modelName, frpStatus.tunnelUrl]);

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
                setImportResult(`Imported ${result.imported} conversation(s).`);
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

    // Get notebook cells
    async function handleGetCells() {
        setLoadingCells(true);
        try {
            const res = await fetch("/api/frp/provision", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({}),
            });
            if (res.ok) {
                const data = await res.json();
                setNotebookCells(data.cells);
                setShowCells(true);
            }
        } catch { }
        setLoadingCells(false);
    }

    // Connect with tunnel URL
    async function handleConnect() {
        if (!tunnelUrl.trim()) return;
        setConnecting(true);
        try {
            const res = await fetch("/api/frp/provision", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    tunnelUrl: tunnelUrl.trim(),
                    label: frpLabel || "My Remote LLM",
                    modelName: frpModelName || undefined,
                }),
            });
            if (res.ok) {
                const data = await res.json();
                setFrpStatus({
                    configured: true,
                    status: data.status,
                    label: data.label,
                    modelName: data.modelName,
                    tunnelUrl: data.tunnelUrl,
                });
            } else {
                const err = await res.json();
                alert(err.error || "Connection failed");
            }
        } catch {
            alert("Failed to connect");
        }
        setConnecting(false);
    }

    async function handleHealthCheck() {
        setHealthChecking(true);
        try {
            const res = await fetch("/api/frp/status");
            if (res.ok) {
                const data = await res.json();
                setFrpStatus({
                    configured: !!data.endpoint,
                    status: data.status,
                    label: data.endpoint?.label || frpStatus.label,
                    modelName: data.endpoint?.modelName || frpStatus.modelName,
                    tunnelUrl: data.endpoint?.tunnelUrl,
                });
            }
        } catch { }
        setHealthChecking(false);
    }

    async function handleDisconnect() {
        if (!confirm("Remove your remote LLM connection?")) return;
        try {
            await fetch("/api/frp/teardown", { method: "DELETE" });
            setFrpStatus({
                configured: false,
                status: "not_configured",
                label: "Remote LLM",
                modelName: "default",
            });
            setNotebookCells(null);
            setShowCells(false);
            setTunnelUrl("");
        } catch { }
    }

    function handleCopy(text: string, label: string) {
        navigator.clipboard.writeText(text);
        setCopied(label);
        setTimeout(() => setCopied(null), 2000);
    }

    const statusColor =
        frpStatus.status === "connected" ? "#22c55e" :
            frpStatus.status === "pending" ? "#eab308" :
                frpStatus.status === "disconnected" ? "#ef4444" : "var(--text-tertiary)";

    const statusLabel =
        frpStatus.status === "connected" ? "Connected ✓" :
            frpStatus.status === "pending" ? "Checking…" :
                frpStatus.status === "disconnected" ? "Disconnected" : "Not configured";

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
                                    {frpStatus.configured && (
                                        <option value="frp-llm">🔗 {frpStatus.label}</option>
                                    )}
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
                                    <label className="text-sm" style={{ color: "var(--text-primary)" }}>Temperature</label>
                                    <span className="text-sm font-mono" style={{ color: "var(--text-secondary)" }}>{settings.temperature}</span>
                                </div>
                                <input type="range" min="0" max="2" step="0.1" value={settings.temperature}
                                    onChange={(e) => setSettings({ temperature: parseFloat(e.target.value) })}
                                    className="w-full accent-[var(--accent)]" />
                            </div>
                        </div>
                    </section>

                    {/* ──────── REMOTE LLM ──────── */}
                    <section>
                        <h2 className="text-sm font-medium mb-3 flex items-center gap-2" style={{ color: "var(--text-secondary)" }}>
                            <Radio className="w-4 h-4" />
                            REMOTE LLM
                        </h2>
                        <div className="rounded-xl p-5 space-y-4" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-default)" }}>

                            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                                Run your own LLM on <strong>Kaggle</strong> or <strong>Google Colab</strong> (free GPU) and connect it here.
                                No complicated setup — just copy a cell, run it, and paste the URL.
                            </p>

                            {/* ── Connected status ── */}
                            {frpStatus.configured && (
                                <div className="flex items-center justify-between p-3 rounded-lg"
                                    style={{ background: "var(--bg-primary)", border: "1px solid var(--border-light)" }}>
                                    <div className="flex items-center gap-3">
                                        <span className="w-3 h-3 rounded-full flex-shrink-0"
                                            style={{ background: statusColor, animation: frpStatus.status === "pending" ? "pulse 2s infinite" : "none" }} />
                                        <div>
                                            <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{frpStatus.label}</p>
                                            <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                                                {statusLabel}
                                                {frpStatus.tunnelUrl && (
                                                    <> • <span className="font-mono">{frpStatus.tunnelUrl.replace("https://", "").slice(0, 30)}…</span></>
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button onClick={handleHealthCheck} disabled={healthChecking}
                                            className="p-2 rounded-lg transition-colors hover:opacity-80"
                                            style={{ color: "var(--text-tertiary)" }} title="Check connection">
                                            <RefreshCw className={`w-4 h-4 ${healthChecking ? "animate-spin" : ""}`} />
                                        </button>
                                        <button onClick={handleDisconnect}
                                            className="p-2 rounded-lg transition-colors hover:opacity-80"
                                            style={{ color: "#ef4444" }} title="Disconnect">
                                            <Unplug className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* ── Connected success banner ── */}
                            {frpStatus.status === "connected" && (
                                <div className="p-3 rounded-lg text-sm" style={{ background: "rgba(34,197,94,0.1)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.2)" }}>
                                    ✅ <strong>Connected!</strong> Select <strong>&quot;🔗 {frpStatus.label}&quot;</strong> from the model dropdown to chat with your LLM.
                                </div>
                            )}

                            {/* ── Step 1: Get notebook cell ── */}
                            {!frpStatus.configured && !showCells && (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: "var(--accent)", color: "var(--text-inverse)" }}>1</div>
                                        <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>Get the notebook cell</p>
                                    </div>
                                    <button onClick={handleGetCells} disabled={loadingCells}
                                        className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all"
                                        style={{ background: "var(--accent)", color: "var(--text-inverse)" }}>
                                        {loadingCells ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
                                        Generate Kaggle/Colab Cell
                                    </button>
                                </div>
                            )}

                            {/* ── Notebook cells ── */}
                            {showCells && notebookCells && !frpStatus.configured && (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: "var(--accent)", color: "var(--text-inverse)" }}>1</div>
                                        <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>Copy and run in your notebook</p>
                                    </div>

                                    <div className="flex gap-1 p-0.5 rounded-lg" style={{ background: "var(--bg-primary)" }}>
                                        {([{ id: "kaggle" as const, label: "Kaggle" }, { id: "colab" as const, label: "Colab" }]).map((tab) => (
                                            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                                                className="flex-1 px-3 py-2 text-xs font-medium rounded-md transition-all"
                                                style={{
                                                    background: activeTab === tab.id ? "var(--accent-light)" : "transparent",
                                                    color: activeTab === tab.id ? "var(--accent)" : "var(--text-tertiary)",
                                                }}>
                                                {tab.label}
                                            </button>
                                        ))}
                                    </div>

                                    <div className="relative">
                                        <pre className="text-xs leading-relaxed p-4 rounded-lg overflow-x-auto"
                                            style={{ background: "#0d1117", color: "#c9d1d9", maxHeight: "250px" }}>
                                            {activeTab === "kaggle" ? notebookCells.kaggleCell : notebookCells.colabCell}
                                        </pre>
                                        <button
                                            onClick={() => {
                                                const text = activeTab === "kaggle" ? notebookCells.kaggleCell : notebookCells.colabCell;
                                                handleCopy(text, activeTab);
                                            }}
                                            className="absolute top-2 right-2 p-2 rounded-md transition-all"
                                            style={{ background: "rgba(255,255,255,0.1)", color: copied === activeTab ? "#22c55e" : "#c9d1d9" }}>
                                            {copied === activeTab ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                        </button>
                                    </div>

                                    {/* ── Step 2: Paste URL ── */}
                                    <div className="flex items-center gap-2 mt-4">
                                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: "var(--accent)", color: "var(--text-inverse)" }}>2</div>
                                        <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>Paste the tunnel URL from the cell output</p>
                                    </div>

                                    <input value={tunnelUrl} onChange={(e) => setTunnelUrl(e.target.value)}
                                        placeholder="https://abc-xyz.trycloudflare.com"
                                        className="w-full px-3 py-2.5 text-sm rounded-lg outline-none font-mono"
                                        style={{ background: "var(--bg-primary)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }} />

                                    <div className="flex gap-2">
                                        <input value={frpLabel} onChange={(e) => setFrpLabel(e.target.value)}
                                            placeholder="Label (e.g. My Kaggle Qwen 14B)"
                                            className="flex-1 px-3 py-2 text-sm rounded-lg outline-none"
                                            style={{ background: "var(--bg-primary)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }} />
                                        <input value={frpModelName} onChange={(e) => setFrpModelName(e.target.value)}
                                            placeholder="Model name (optional)"
                                            className="flex-1 px-3 py-2 text-sm rounded-lg outline-none"
                                            style={{ background: "var(--bg-primary)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }} />
                                    </div>

                                    <button onClick={handleConnect}
                                        disabled={connecting || !tunnelUrl.trim()}
                                        className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all disabled:opacity-40"
                                        style={{ background: "#22c55e", color: "white" }}>
                                        {connecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link className="w-4 h-4" />}
                                        Connect
                                    </button>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Import/Export */}
                    <section>
                        <h2 className="text-sm font-medium mb-3" style={{ color: "var(--text-secondary)" }}>DATA</h2>
                        <div className="flex gap-3">
                            <button onClick={handleExport}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all"
                                style={{ background: "var(--bg-secondary)", color: "var(--text-primary)", border: "1px solid var(--border-default)" }}>
                                <Download className="w-4 h-4" /> Export Chats
                            </button>
                            <button onClick={() => fileInputRef.current?.click()}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all"
                                style={{ background: "var(--bg-secondary)", color: "var(--text-primary)", border: "1px solid var(--border-default)" }}>
                                <Upload className="w-4 h-4" /> Import Chats
                            </button>
                            <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
                        </div>
                        {importResult && <p className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>{importResult}</p>}
                    </section>

                    {/* Memory */}
                    <section>
                        <h2 className="text-sm font-medium mb-3 flex items-center gap-2" style={{ color: "var(--text-secondary)" }}>
                            <Brain className="w-4 h-4" /> MEMORY
                        </h2>
                        {loadingMemories ? (
                            <div className="flex items-center gap-2 py-4" style={{ color: "var(--text-tertiary)" }}>
                                <Loader2 className="w-4 h-4 animate-spin" /> Loading memories…
                            </div>
                        ) : memories.length === 0 ? (
                            <p className="text-sm py-4" style={{ color: "var(--text-tertiary)" }}>
                                No memory items yet.
                            </p>
                        ) : (
                            <div className="space-y-2">
                                {memories.map((m) => (
                                    <div key={m.id} className="flex items-start gap-3 p-3 rounded-lg"
                                        style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-light)" }}>
                                        <p className="flex-1 text-sm" style={{ color: "var(--text-primary)" }}>{m.content}</p>
                                        <button onClick={() => handleDeleteMemory(m.id)}
                                            className="p-1.5 rounded-md flex-shrink-0 transition-colors hover:opacity-80"
                                            style={{ color: "var(--text-tertiary)" }} aria-label="Delete memory">
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
