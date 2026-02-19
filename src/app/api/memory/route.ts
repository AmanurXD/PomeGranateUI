import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { addMemory, listMemories, deleteMemory } from "@/lib/memory";

// GET /api/memory – list user memory items
export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const memories = await listMemories(session.user.id);
        return NextResponse.json(memories);
    } catch (error) {
        console.error("Memory list error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// POST /api/memory – add memory item
export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { content } = await request.json();
        if (!content || typeof content !== "string") {
            return NextResponse.json({ error: "Content is required" }, { status: 400 });
        }

        const id = await addMemory(session.user.id, content);
        return NextResponse.json({ id }, { status: 201 });
    } catch (error) {
        console.error("Memory add error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// DELETE /api/memory?id=xxx
export async function DELETE(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ error: "Memory ID required" }, { status: 400 });
        }

        await deleteMemory(session.user.id, id);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Memory delete error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
