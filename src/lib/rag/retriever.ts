import { prisma } from "@/lib/prisma";
import type { RetrievedSource } from "@/types";

export interface RetrieveOptions {
    queryEmbedding: number[];
    topK?: number;
    scoreThreshold?: number;
    userId?: string;
}

/**
 * Retrieve relevant document chunks using pgvector cosine similarity.
 * Falls back to empty results if pgvector is not available.
 */
export async function retrieveChunks(
    options: RetrieveOptions
): Promise<RetrievedSource[]> {
    const { queryEmbedding, topK = 5, scoreThreshold = 0.3, userId } = options;

    try {
        const embeddingStr = `[${queryEmbedding.join(",")}]`;

        const results: any[] = await prisma.$queryRawUnsafe(`
      SELECT
        dc.id,
        dc."documentId",
        dc."chunkIndex",
        dc.content,
        d.title as "documentTitle",
        1 - (dc.embedding <=> $1::vector) as score
      FROM "DocumentChunk" dc
      JOIN "Document" d ON dc."documentId" = d.id
      WHERE dc.embedding IS NOT NULL
        ${userId ? `AND d."userId" = $3` : ""}
      ORDER BY dc.embedding <=> $1::vector
      LIMIT $2
    `,
            embeddingStr,
            topK,
            ...(userId ? [userId] : [])
        );

        return results
            .filter((r) => r.score >= scoreThreshold)
            .map((r) => ({
                documentId: r.documentId,
                documentTitle: r.documentTitle,
                chunkIndex: r.chunkIndex,
                content: r.content,
                score: r.score,
            }));
    } catch (error) {
        console.error("Vector retrieval error:", error);
        return [];
    }
}
