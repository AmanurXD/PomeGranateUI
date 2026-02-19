import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

// GET /api/conversations – list user conversations
export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const conversations = await prisma.conversation.findMany({
            where: { userId: session.user.id },
            orderBy: { updatedAt: "desc" },
            select: {
                id: true,
                title: true,
                isArchived: true,
                isPinned: true,
                model: true,
                updatedAt: true,
                createdAt: true,
            },
        });

        return NextResponse.json(conversations);
    } catch (error) {
        console.error("List conversations error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

const createSchema = z.object({
    title: z.string().min(1).max(200).optional(),
    model: z.string().optional(),
    systemPrompt: z.string().optional(),
});

// POST /api/conversations – create new conversation
export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json().catch(() => ({}));
        const parsed = createSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
        }

        const conversation = await prisma.conversation.create({
            data: {
                userId: session.user.id,
                title: parsed.data.title || "New conversation",
                model: parsed.data.model,
                systemPrompt: parsed.data.systemPrompt,
            },
        });

        return NextResponse.json(conversation, { status: 201 });
    } catch (error) {
        console.error("Create conversation error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
