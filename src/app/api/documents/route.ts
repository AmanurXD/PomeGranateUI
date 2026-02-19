import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { ingestDocument } from "@/lib/rag/pipeline";
import { z } from "zod";

const uploadSchema = z.object({
    title: z.string().min(1).max(200),
    content: z.string().min(1),
    sourceType: z.enum(["text", "markdown", "pdf"]),
    chunkSize: z.number().min(100).max(4000).optional(),
    chunkOverlap: z.number().min(0).max(1000).optional(),
});

export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const parsed = uploadSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
        }

        const docId = await ingestDocument(
            session.user.id,
            parsed.data.title,
            parsed.data.content,
            parsed.data.sourceType,
            {
                chunkSize: parsed.data.chunkSize,
                chunkOverlap: parsed.data.chunkOverlap,
            }
        );

        return NextResponse.json({ id: docId }, { status: 201 });
    } catch (error) {
        console.error("Document upload error:", error);
        return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }
}
