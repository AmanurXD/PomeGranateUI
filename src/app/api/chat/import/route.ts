import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

const messageSchema = z.object({
    role: z.string(),
    content: z.string(),
    parentId: z.string().nullish(),
    metadata: z.any().optional(),
    createdAt: z.string().optional(),
    versions: z.array(z.object({
        versionIndex: z.number(),
        content: z.string(),
        metadata: z.any().optional(),
        createdAt: z.string().optional(),
    })).optional(),
    feedback: z.array(z.object({
        rating: z.number(),
        note: z.string().nullish(),
    })).optional(),
});

const conversationSchema = z.object({
    title: z.string(),
    model: z.string().nullish(),
    systemPrompt: z.string().nullish(),
    isPinned: z.boolean().optional(),
    isArchived: z.boolean().optional(),
    createdAt: z.string().optional(),
    messages: z.array(messageSchema),
});

const importSchema = z.object({
    conversations: z.array(conversationSchema),
});

// POST /api/chat/import – import conversations from JSON
export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const parsed = importSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                { error: "Invalid import format", details: parsed.error.issues },
                { status: 400 }
            );
        }

        const results = { imported: 0, failed: 0, errors: [] as string[] };

        for (const conv of parsed.data.conversations) {
            try {
                const conversation = await prisma.conversation.create({
                    data: {
                        userId: session.user.id,
                        title: conv.title,
                        model: conv.model,
                        systemPrompt: conv.systemPrompt,
                        isPinned: conv.isPinned || false,
                        isArchived: conv.isArchived || false,
                    },
                });

                // Create messages
                for (const msg of conv.messages) {
                    const message = await prisma.message.create({
                        data: {
                            conversationId: conversation.id,
                            userId: session.user.id,
                            role: msg.role,
                            content: msg.content,
                            metadata: msg.metadata as any,
                        },
                    });

                    // Create versions
                    if (msg.versions?.length) {
                        await prisma.messageVersion.createMany({
                            data: msg.versions.map((v) => ({
                                messageId: message.id,
                                versionIndex: v.versionIndex,
                                content: v.content,
                                metadata: v.metadata as any,
                            })),
                        });
                    }

                    // Create feedback
                    if (msg.feedback?.length) {
                        for (const fb of msg.feedback) {
                            await prisma.feedback.create({
                                data: {
                                    messageId: message.id,
                                    userId: session.user.id,
                                    rating: fb.rating,
                                    note: fb.note,
                                },
                            });
                        }
                    }
                }

                results.imported++;
            } catch (err: any) {
                results.failed++;
                results.errors.push(`"${conv.title}": ${err.message}`);
            }
        }

        return NextResponse.json(results);
    } catch (error) {
        console.error("Import error:", error);
        return NextResponse.json({ error: "Import failed" }, { status: 500 });
    }
}
