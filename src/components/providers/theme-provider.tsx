"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

type Theme = "light" | "dark" | "system";

interface ThemeContextType {
    theme: Theme;
    resolvedTheme: "light" | "dark";
    setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [theme, setThemeState] = useState<Theme>("system");
    const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");

    useEffect(() => {
        const stored = localStorage.getItem("theme") as Theme | null;
        if (stored) setThemeState(stored);
    }, []);

    useEffect(() => {
        const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

        function resolve() {
            const isDark =
                theme === "dark" || (theme === "system" && mediaQuery.matches);
            setResolvedTheme(isDark ? "dark" : "light");
            document.documentElement.classList.toggle("dark", isDark);
        }

        resolve();
        mediaQuery.addEventListener("change", resolve);
        return () => mediaQuery.removeEventListener("change", resolve);
    }, [theme]);

    function setTheme(t: Theme) {
        setThemeState(t);
        localStorage.setItem("theme", t);
    }

    return (
        <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const ctx = useContext(ThemeContext);
    if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
    return ctx;
}
