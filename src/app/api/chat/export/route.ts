import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

// POST /api/chat/export – export conversations as JSON
export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json().catch(() => ({}));
        const conversationIds = body.conversationIds as string[] | undefined;

        const where: any = { userId: session.user.id };
        if (conversationIds?.length) {
            where.id = { in: conversationIds };
        }

        const conversations = await prisma.conversation.findMany({
            where,
            include: {
                messages: {
                    orderBy: { createdAt: "asc" },
                    include: {
                        versions: { orderBy: { versionIndex: "asc" } },
                        feedback: true,
                    },
                },
            },
            orderBy: { createdAt: "asc" },
        });

        const exportData = {
            version: 1,
            exportedAt: new Date().toISOString(),
            userId: session.user.id,
            conversations: conversations.map((c) => ({
                id: c.id,
                title: c.title,
                model: c.model,
                systemPrompt: c.systemPrompt,
                isPinned: c.isPinned,
                isArchived: c.isArchived,
                createdAt: c.createdAt.toISOString(),
                updatedAt: c.updatedAt.toISOString(),
                messages: c.messages.map((m) => ({
                    id: m.id,
                    role: m.role,
                    content: m.content,
                    parentId: m.parentId,
                    metadata: m.metadata,
                    createdAt: m.createdAt.toISOString(),
                    versions: m.versions.map((v) => ({
                        versionIndex: v.versionIndex,
                        content: v.content,
                        metadata: v.metadata,
                        createdAt: v.createdAt.toISOString(),
                    })),
                    feedback: m.feedback.map((f) => ({
                        rating: f.rating,
                        note: f.note,
                    })),
                })),
            })),
        };

        return NextResponse.json(exportData);
    } catch (error) {
        console.error("Export error:", error);
        return NextResponse.json({ error: "Export failed" }, { status: 500 });
    }
}
