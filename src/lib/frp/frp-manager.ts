import { prisma } from "@/lib/prisma";

/**
 * Save/update a tunnel URL for the user.
 */
export async function connectEndpoint(
    userId: string,
    tunnelUrl: string,
    label?: string,
    modelName?: string
) {
    // Upsert: create or update
    const existing = await prisma.frpEndpoint.findFirst({
        where: { userId },
    });

    if (existing) {
        return prisma.frpEndpoint.update({
            where: { id: existing.id },
            data: {
                tunnelUrl: tunnelUrl.replace(/\/$/, ""), // strip trailing slash
                label: label || existing.label,
                modelName: modelName || existing.modelName,
                status: "pending",
            },
        });
    }

    return prisma.frpEndpoint.create({
        data: {
            userId,
            tunnelUrl: tunnelUrl.replace(/\/$/, ""),
            label: label || "My Remote LLM",
            modelName: modelName || "default",
            status: "pending",
        },
    });
}

/**
 * Check health by pinging the tunnel URL directly.
 * Tries /v1/models, then /health, then root.
 */
export async function checkEndpointHealth(userId: string): Promise<{
    status: string;
    models: string[];
    endpoint: any | null;
}> {
    const endpoint = await prisma.frpEndpoint.findFirst({
        where: { userId },
    });

    if (!endpoint || !endpoint.tunnelUrl) {
        return { status: "not_configured", models: [], endpoint: null };
    }

    const baseUrl = endpoint.tunnelUrl;
    const checks = [
        { url: `${baseUrl}/v1/models`, parseModels: true },
        { url: `${baseUrl}/health`, parseModels: false },
        { url: baseUrl, parseModels: false },
    ];

    for (const check of checks) {
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 10000);

            const res = await fetch(check.url, { signal: controller.signal });
            clearTimeout(timeout);

            if (res.ok || res.status < 500) {
                let models: string[] = [];

                if (check.parseModels) {
                    try {
                        const data = await res.json();
                        models = (data.data || []).map((m: any) => m.id || m.name || "unknown");
                    } catch {
                        // JSON parse failed, but server is reachable
                    }
                }

                await prisma.frpEndpoint.update({
                    where: { id: endpoint.id },
                    data: { status: "connected", lastSeenAt: new Date() },
                });

                return { status: "connected", models, endpoint };
            }
        } catch {
            continue;
        }
    }

    // All checks failed
    await prisma.frpEndpoint.update({
        where: { id: endpoint.id },
        data: { status: "disconnected" },
    });

    return { status: "disconnected", models: [], endpoint };
}

/**
 * Tear down a user's endpoint.
 */
export async function teardownEndpoint(userId: string) {
    return prisma.frpEndpoint.deleteMany({
        where: { userId },
    });
}

/**
 * Get endpoint for a user (for routing requests).
 */
export async function getEndpoint(userId: string) {
    return prisma.frpEndpoint.findFirst({
        where: { userId },
    });
}
