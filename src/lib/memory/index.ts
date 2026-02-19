import { prisma } from "@/lib/prisma";
import { createLLMAdapter } from "@/lib/llm/openai";

/**
 * Add a memory item for a user (vectorized for semantic retrieval).
 */
export async function addMemory(userId: string, content: string): Promise<string> {
    const adapter = createLLMAdapter();

    const item = await prisma.memoryItem.create({
        data: { userId, content },
    });

    try {
        const [embedding] = await adapter.createEmbeddings({ texts: [content] });
        const embeddingStr = `[${embedding.join(",")}]`;

        await prisma.$executeRawUnsafe(
            `UPDATE "MemoryItem" SET embedding = $1::vector WHERE id = $2`,
            embeddingStr,
            item.id
        );
    } catch (error) {
        console.error("Memory embedding error:", error);
    }

    return item.id;
}

/**
 * List all memory items for a user.
 */
export async function listMemories(userId: string) {
    return prisma.memoryItem.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        select: { id: true, content: true, createdAt: true },
    });
}

/**
 * Delete a memory item.
 */
export async function deleteMemory(userId: string, memoryId: string) {
    return prisma.memoryItem.deleteMany({
        where: { id: memoryId, userId },
    });
}

/**
 * Retrieve relevant memories using semantic search.
 */
export async function queryMemories(
    userId: string,
    query: string,
    topK = 5
): Promise<{ content: string; score: number }[]> {
    const adapter = createLLMAdapter();

    try {
        const [queryEmbedding] = await adapter.createEmbeddings({ texts: [query] });
        const embeddingStr = `[${queryEmbedding.join(",")}]`;

        const results: any[] = await prisma.$queryRawUnsafe(
            `SELECT id, content,
              1 - (embedding <=> $1::vector) as score
       FROM "MemoryItem"
       WHERE "userId" = $2 AND embedding IS NOT NULL
       ORDER BY embedding <=> $1::vector
       LIMIT $3`,
            embeddingStr,
            userId,
            topK
        );

        return results
            .filter((r) => r.score > 0.3)
            .map((r) => ({ content: r.content, score: r.score }));
    } catch (error) {
        console.error("Memory query error:", error);
        return [];
    }
}
