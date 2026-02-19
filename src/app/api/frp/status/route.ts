import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { checkEndpointHealth } from "@/lib/frp/frp-manager";

// GET /api/frp/status – check FRP tunnel health
export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const result = await checkEndpointHealth(session.user.id);

        return NextResponse.json({
            status: result.status,
            models: result.models,
            endpoint: result.endpoint
                ? {
                    id: result.endpoint.id,
                    label: result.endpoint.label,
                    modelName: result.endpoint.modelName,
                    assignedPort: result.endpoint.assignedPort,
                    status: result.endpoint.status,
                    lastSeenAt: result.endpoint.lastSeenAt,
                }
                : null,
        });
    } catch (error) {
        console.error("FRP status error:", error);
        return NextResponse.json({ error: "Status check failed" }, { status: 500 });
    }
}
