import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectEndpoint } from "@/lib/frp/frp-manager";
import { checkEndpointHealth } from "@/lib/frp/frp-manager";
import { generateNotebookCells } from "@/lib/frp/frpc-template";
import { z } from "zod";

const provisionSchema = z.object({
    tunnelUrl: z.string().url().optional(),
    label: z.string().max(100).optional(),
    modelName: z.string().max(100).optional(),
});

/**
 * POST /api/frp/provision
 *
 * Two modes:
 * 1. Without tunnelUrl → returns notebook cells for the user to run
 * 2. With tunnelUrl → saves the URL and tests connection
 */
export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const parsed = provisionSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                { error: parsed.error.issues[0].message },
                { status: 400 }
            );
        }

        const { tunnelUrl, label, modelName } = parsed.data;

        // If tunnelUrl provided, save it and check health
        if (tunnelUrl) {
            const endpoint = await connectEndpoint(
                session.user.id,
                tunnelUrl,
                label,
                modelName
            );

            // Immediately check health
            const health = await checkEndpointHealth(session.user.id);

            return NextResponse.json({
                ...endpoint,
                status: health.status,
                models: health.models,
            });
        }

        // No tunnelUrl → just return notebook cells
        const cells = generateNotebookCells();
        return NextResponse.json({
            cells,
            message: "Run the notebook cell, then paste the tunnel URL back here.",
        });
    } catch (error: any) {
        console.error("Provision error:", error);
        return NextResponse.json(
            { error: error.message || "Internal error" },
            { status: 500 }
        );
    }
}
