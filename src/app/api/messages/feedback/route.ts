import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

const feedbackSchema = z.object({
    messageId: z.string(),
    rating: z.number().int().min(-1).max(1),
    note: z.string().optional(),
});

export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const parsed = feedbackSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
        }

        const { messageId, rating, note } = parsed.data;

        if (rating === 0) {
            // Remove feedback
            await prisma.feedback.deleteMany({
                where: { messageId, userId: session.user.id },
            });
            return NextResponse.json({ success: true });
        }

        const feedback = await prisma.feedback.upsert({
            where: {
                messageId_userId: { messageId, userId: session.user.id },
            },
            create: {
                messageId,
                userId: session.user.id,
                rating,
                note,
            },
            update: { rating, note },
        });

        return NextResponse.json(feedback);
    } catch (error) {
        console.error("Feedback error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
