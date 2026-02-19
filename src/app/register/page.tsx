"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { Eye, EyeOff, MessageSquare, Loader2 } from "lucide-react";

export default function RegisterPage() {
    const router = useRouter();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password, name }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Registration failed");
                return;
            }

            // Auto sign-in after registration
            const signInRes = await signIn("credentials", {
                email,
                password,
                redirect: false,
            });

            if (signInRes?.error) {
                router.push("/login");
            } else {
                router.push("/chat");
                router.refresh();
            }
        } catch {
            setError("Something went wrong");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-secondary)" }}>
            <div
                className="w-full max-w-sm p-8 rounded-2xl animate-fade-in"
                style={{
                    background: "var(--bg-primary)",
                    boxShadow: "var(--shadow-lg)",
                    border: "1px solid var(--border-light)",
                }}
            >
                <div className="flex flex-col items-center mb-8">
                    <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                        style={{ background: "var(--accent)" }}
                    >
                        <MessageSquare className="w-6 h-6" style={{ color: "var(--text-inverse)" }} />
                    </div>
                    <h1 className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>
                        Create your account
                    </h1>
                    <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
                        Get started for free
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div
                            className="text-sm px-4 py-3 rounded-lg"
                            style={{ background: "#ef44441a", color: "var(--error)" }}
                        >
                            {error}
                        </div>
                    )}

                    <div>
                        <label htmlFor="name" className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-primary)" }}>
                            Full name
                        </label>
                        <input
                            id="name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="John Doe"
                            required
                            autoFocus
                            className="w-full px-3.5 py-2.5 text-sm rounded-lg outline-none transition-all"
                            style={{
                                background: "var(--bg-secondary)",
                                border: "1px solid var(--border-default)",
                                color: "var(--text-primary)",
                            }}
                        />
                    </div>

                    <div>
                        <label htmlFor="email" className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-primary)" }}>
                            Email address
                        </label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            required
                            className="w-full px-3.5 py-2.5 text-sm rounded-lg outline-none transition-all"
                            style={{
                                background: "var(--bg-secondary)",
                                border: "1px solid var(--border-default)",
                                color: "var(--text-primary)",
                            }}
                        />
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-primary)" }}>
                            Password
                        </label>
                        <div className="relative">
                            <input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Min 8 characters"
                                required
                                minLength={8}
                                className="w-full px-3.5 py-2.5 text-sm rounded-lg outline-none pr-10 transition-all"
                                style={{
                                    background: "var(--bg-secondary)",
                                    border: "1px solid var(--border-default)",
                                    color: "var(--text-primary)",
                                }}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5"
                                style={{ color: "var(--text-tertiary)" }}
                                aria-label={showPassword ? "Hide password" : "Show password"}
                            >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-2.5 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                        style={{
                            background: "var(--accent)",
                            color: "var(--text-inverse)",
                        }}
                    >
                        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                        Create account
                    </button>
                </form>

                <p className="text-sm text-center mt-6" style={{ color: "var(--text-secondary)" }}>
                    Already have an account?{" "}
                    <Link
                        href="/login"
                        className="font-medium hover:underline"
                        style={{ color: "var(--accent)" }}
                    >
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
    );
}
