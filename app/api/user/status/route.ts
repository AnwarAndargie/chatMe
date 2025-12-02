import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const { isOnline } = await req.json();

        await prisma.user.update({
            where: { id: session.user.id },
            data: {
                isOnline,
                lastSeen: isOnline ? undefined : new Date()
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.log("[USER_STATUS_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
