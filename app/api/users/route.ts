import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const users = await prisma.user.findMany({
            where: {
                id: {
                    not: session.user.id
                }
            },
            select: {
                id: true,
                name: true,
                image: true,
                isOnline: true,
                lastSeen: true
            }
        });

        return NextResponse.json(users);
    } catch (error) {
        console.log("[USERS_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
