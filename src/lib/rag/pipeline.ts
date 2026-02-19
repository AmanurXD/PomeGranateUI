import { prisma } from "@/lib/prisma";
import { createLLMAdapter } from "@/lib/llm/openai";
import { chunkText, type ChunkOptions } from "./chunker";
import { retrieveChunks, type RetrieveOptions } from "./retriever";
import type { RetrievedSource } from "@/types";

/**
 * Ingest a document: chunk text → embed chunks → store in DB.
 */
export async function ingestDocument(
    userId: string,
    title: string,
    content: string,
    sourceType: string,
    chunkOptions?: ChunkOptions
): Promise<string> {
    const adapter = createLLMAdapter();

    // Create document record
    const doc = await prisma.document.create({
        data: { userId, title, sourceType },
    });

    // Chunk the text
    const chunks = chunkText(content, chunkOptions);

    // Generate embeddings in batches
    const batchSize = 20;
    for (let i = 0; i < chunks.length; i += batchSize) {
        const batch = chunks.slice(i, i + batchSize);
        const texts = batch.map((c) => c.content);

        try {
            const embeddings = await adapter.createEmbeddings({ texts });

            // Store chunks with embeddings
            for (let j = 0; j < batch.length; j++) {
                const chunk = batch[j];
                const embedding = embeddings[j];
                const embeddingStr = `[${embedding.join(",")}]`;

                await prisma.$executeRawUnsafe(
                    `INSERT INTO "DocumentChunk" (id, "documentId", "chunkIndex", content, embedding)
           VALUES ($1, $2, $3, $4, $5::vector)`,
                    `chunk_${doc.id}_${chunk.index}`,
                    doc.id,
                    chunk.index,
                    chunk.content,
                    embeddingStr
                );
            }
        } catch (error) {
            console.error("Embedding batch error:", error);
            // Store chunks without embeddings as fallback
            for (const chunk of batch) {
                await prisma.documentChunk.create({
                    data: {
                        documentId: doc.id,
                        chunkIndex: chunk.index,
                        content: chunk.content,
                    },
                });
            }
        }
    }

    return doc.id;
}

/**
 * Query the RAG pipeline: embed query → retrieve → format sources.
 */
export async function queryRAG(
    query: string,
    userId: string,
    topK?: number
): Promise<{ sources: RetrievedSource[]; context: string }> {
    const adapter = createLLMAdapter();

    try {
        const [queryEmbedding] = await adapter.createEmbeddings({ texts: [query] });

        const sources = await retrieveChunks({
            queryEmbedding,
            topK: topK || 5,
            userId,
        });

        const context = sources.length
            ? sources.map((s, i) => `[Source ${i + 1}: ${s.documentTitle}]\n${s.content}`).join("\n\n")
            : "";

        return { sources, context };
    } catch (error) {
        console.error("RAG query error:", error);
        return { sources: [], context: "" };
    }
}
