import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { teardownEndpoint } from "@/lib/frp/frp-manager";

// DELETE /api/frp/teardown – remove FRP endpoint
export async function DELETE() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await teardownEndpoint(session.user.id);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("FRP teardown error:", error);
        return NextResponse.json({ error: "Teardown failed" }, { status: 500 });
    }
}
