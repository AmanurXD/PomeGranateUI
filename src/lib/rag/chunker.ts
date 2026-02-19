/** Configurable text chunker for RAG pipeline */

export interface ChunkOptions {
    chunkSize?: number;
    chunkOverlap?: number;
}

export interface TextChunk {
    content: string;
    index: number;
    metadata?: Record<string, unknown>;
}

export function chunkText(
    text: string,
    options: ChunkOptions = {}
): TextChunk[] {
    const chunkSize = options.chunkSize || 800;
    const overlap = options.chunkOverlap || 120;

    const chunks: TextChunk[] = [];
    let start = 0;
    let index = 0;

    while (start < text.length) {
        let end = start + chunkSize;

        // Try to break at sentence boundary
        if (end < text.length) {
            const slice = text.slice(start, end + 50);
            const sentenceEnd = slice.lastIndexOf(". ");
            if (sentenceEnd > chunkSize * 0.5) {
                end = start + sentenceEnd + 2;
            }
        }

        const content = text.slice(start, Math.min(end, text.length)).trim();
        if (content) {
            chunks.push({ content, index });
            index++;
        }

        start = end - overlap;
    }

    return chunks;
}
