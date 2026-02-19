import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";
import { createLLMAdapter } from "@/lib/llm/openai";
import type { LLMMessage } from "@/lib/llm/adapter";

const streamSchema = z.object({
    conversationId: z.string().optional(),
    messages: z.array(
        z.object({
            role: z.enum(["user", "assistant", "system", "tool"]),
            content: z.string(),
        })
    ),
    model: z.string().optional(),
    temperature: z.number().min(0).max(2).optional(),
    maxTokens: z.number().min(1).max(128000).optional(),
    systemPrompt: z.string().optional(),
    enableRag: z.boolean().optional(),
    topK: z.number().min(1).max(20).optional(),
});

export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const parsed = streamSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                { error: parsed.error.issues[0].message },
                { status: 400 }
            );
        }

        const {
            conversationId,
            messages: clientMessages,
            model = process.env.DEFAULT_MODEL || "gpt-4o-mini",
            temperature = 0.7,
            maxTokens = 4096,
            systemPrompt = "You are a helpful assistant.",
        } = parsed.data;

        // Create or get conversation
        let convId = conversationId;
        if (!convId) {
            const lastUserMsg = clientMessages.filter((m) => m.role === "user").pop();
            const title = lastUserMsg?.content.slice(0, 60) || "New conversation";

            const conv = await prisma.conversation.create({
                data: {
                    userId: session.user.id,
                    title,
                    model,
                },
            });
            convId = conv.id;
        } else {
            // Verify ownership
            const conv = await prisma.conversation.findFirst({
                where: { id: convId, userId: session.user.id },
            });
            if (!conv) {
                return NextResponse.json({ error: "Not found" }, { status: 404 });
            }
        }

        // Save user message
        const lastUserContent = clientMessages[clientMessages.length - 1]?.content || "";
        const userMessage = await prisma.message.create({
            data: {
                conversationId: convId,
                userId: session.user.id,
                role: "user",
                content: lastUserContent,
            },
        });

        // Build LLM messages
        const llmMessages: LLMMessage[] = [
            { role: "system", content: systemPrompt },
            ...clientMessages.map((m) => ({ role: m.role, content: m.content })),
        ];

        // Create assistant message placeholder
        const assistantMessage = await prisma.message.create({
            data: {
                conversationId: convId,
                role: "assistant",
                content: "",
                parentId: userMessage.id,
                metadata: { model },
            },
        });

        // Update conversation timestamp
        await prisma.conversation.update({
            where: { id: convId },
            data: { updatedAt: new Date() },
        });

        // Stream response
        const adapter = createLLMAdapter();
        const encoder = new TextEncoder();

        const stream = new ReadableStream({
            async start(controller) {
                try {
                    // Send conversation ID
                    controller.enqueue(
                        encoder.encode(`data: ${JSON.stringify({ conversationId: convId, messageId: assistantMessage.id })}\n\n`)
                    );

                    let fullContent = "";

                    for await (const token of adapter.generateStream({
                        messages: llmMessages,
                        model,
                        temperature,
                        maxTokens,
                    })) {
                        fullContent += token;
                        controller.enqueue(
                            encoder.encode(`data: ${JSON.stringify({ token })}\n\n`)
                        );
                    }

                    // Finalize: save completed content
                    await prisma.message.update({
                        where: { id: assistantMessage.id },
                        data: { content: fullContent },
                    });

                    controller.enqueue(encoder.encode("data: [DONE]\n\n"));
                    controller.close();
                } catch (error: any) {
                    console.error("Stream error:", error);
                    // Send error to client
                    controller.enqueue(
                        encoder.encode(
                            `data: ${JSON.stringify({ error: error.message || "Stream failed" })}\n\n`
                        )
                    );
                    controller.enqueue(encoder.encode("data: [DONE]\n\n"));
                    controller.close();
                }
            },
        });

        return new Response(stream, {
            headers: {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache",
                Connection: "keep-alive",
                "X-Conversation-Id": convId,
            },
        });
    } catch (error) {
        console.error("Chat stream error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
