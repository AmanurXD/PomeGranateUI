import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

type RouteParams = { params: Promise<{ id: string }> };

// GET /api/conversations/:id – get conversation with messages
export async function GET(request: Request, { params }: RouteParams) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        const conversation = await prisma.conversation.findFirst({
            where: { id, userId: session.user.id },
            include: {
                messages: {
                    orderBy: { createdAt: "asc" },
                    include: {
                        versions: { orderBy: { versionIndex: "asc" } },
                        feedback: { where: { userId: session.user.id }, take: 1 },
                    },
                },
            },
        });

        if (!conversation) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }

        return NextResponse.json(conversation);
    } catch (error) {
        console.error("Get conversation error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

const updateSchema = z.object({
    title: z.string().min(1).max(200).optional(),
    isArchived: z.boolean().optional(),
    isPinned: z.boolean().optional(),
    model: z.string().optional(),
    systemPrompt: z.string().optional(),
});

// PATCH /api/conversations/:id – update conversation
export async function PATCH(request: Request, { params }: RouteParams) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();
        const parsed = updateSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
        }

        const conversation = await prisma.conversation.updateMany({
            where: { id, userId: session.user.id },
            data: parsed.data,
        });

        if (conversation.count === 0) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Update conversation error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// DELETE /api/conversations/:id
export async function DELETE(request: Request, { params }: RouteParams) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        const result = await prisma.conversation.deleteMany({
            where: { id, userId: session.user.id },
        });

        if (result.count === 0) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Delete conversation error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
