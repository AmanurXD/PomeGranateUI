import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
    console.log("🌱 Seeding database...");

    // Create demo user
    const passwordHash = await bcrypt.hash("password123", 12);
    const user = await prisma.user.upsert({
        where: { email: "demo@pomegranate.ai" },
        update: {},
        create: {
            email: "demo@pomegranate.ai",
            name: "Demo User",
            passwordHash,
            role: "user",
        },
    });

    console.log(`  ✓ User: ${user.email}`);

    // Create sample conversations
    const conv1 = await prisma.conversation.create({
        data: {
            userId: user.id,
            title: "Hello, PomeGranate!",
            model: "gpt-4o-mini",
        },
    });

    await prisma.message.createMany({
        data: [
            {
                conversationId: conv1.id,
                userId: user.id,
                role: "user",
                content: "Hello! What can you help me with?",
            },
            {
                conversationId: conv1.id,
                role: "assistant",
                content:
                    "Hello! I'm PomeGranate, your AI assistant. I can help you with:\n\n- **Writing & Editing** – drafting emails, essays, reports\n- **Coding** – debugging, explaining code, generating solutions\n- **Analysis** – data interpretation, research summaries\n- **Math** – solving equations, calculations\n- **Creative Work** – brainstorming, storytelling, ideation\n\nHow can I assist you today?",
                metadata: { model: "gpt-4o-mini" },
            },
        ],
    });

    const conv2 = await prisma.conversation.create({
        data: {
            userId: user.id,
            title: "Explain RAG pipelines",
            model: "gpt-4o",
            isPinned: true,
        },
    });

    await prisma.message.createMany({
        data: [
            {
                conversationId: conv2.id,
                userId: user.id,
                role: "user",
                content: "Can you explain how RAG (Retrieval-Augmented Generation) works?",
            },
            {
                conversationId: conv2.id,
                role: "assistant",
                content:
                    "# Retrieval-Augmented Generation (RAG)\n\nRAG combines the power of large language models with external knowledge retrieval. Here's how it works:\n\n## 1. Document Ingestion\n- Documents are split into **chunks** (typically 500-1000 characters)\n- Each chunk is converted into a **vector embedding** using an embedding model\n- Vectors are stored in a **vector database** (like pgvector, Qdrant, etc.)\n\n## 2. Query Processing\n- When a user asks a question, the query is also converted to a vector embedding\n- A **similarity search** finds the most relevant document chunks\n- The top-K most similar chunks are retrieved\n\n## 3. Augmented Generation\n- Retrieved chunks are injected into the LLM's prompt as context\n- The LLM generates a response informed by both its training data AND the retrieved documents\n- Sources/citations can be shown to the user for transparency\n\n## Benefits\n- Reduces hallucinations by grounding responses in real data\n- Allows the model to reference up-to-date information\n- Provides traceable citations\n\nWould you like me to dive deeper into any specific part?",
                metadata: { model: "gpt-4o" },
            },
        ],
    });

    console.log(`  ✓ Created ${2} sample conversations`);

    // Create a memory item
    await prisma.memoryItem.create({
        data: {
            userId: user.id,
            content: "User prefers detailed technical explanations with code examples.",
        },
    });

    console.log("  ✓ Created sample memory item");

    console.log("\n✅ Seed complete!");
    console.log("\n📧 Demo login:");
    console.log("   Email:    demo@pomegranate.ai");
    console.log("   Password: password123");
}

main()
    .catch((e) => {
        console.error("Seed error:", e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
