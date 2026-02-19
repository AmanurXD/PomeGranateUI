/** Feature flags – read from env at build time */
export const featureFlags = {
    rag: process.env.ENABLE_RAG === "true",
    memory: process.env.ENABLE_MEMORY === "true",
    tools: process.env.ENABLE_TOOLS === "true",
    sharing: process.env.ENABLE_SHARING === "true",
} as const;

export type FeatureFlag = keyof typeof featureFlags;

export function isEnabled(flag: FeatureFlag): boolean {
    return featureFlags[flag];
}
