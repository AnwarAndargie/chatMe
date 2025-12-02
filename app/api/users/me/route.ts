import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function PATCH(req: Request) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const body = await req.json();
        const { name, image } = body as { name?: string; image?: string | null };

        if (typeof name !== "string" && typeof image !== "string" && image !== null && image !== undefined) {
            return new NextResponse("Invalid payload", { status: 400 });
        }

        const updatedUser = await prisma.user.update({
            where: { id: session.user.id },
            data: {
                ...(typeof name === "string" ? { name } : {}),
                ...(typeof image === "string" || image === null ? { image } : {}),
            },
            select: {
                id: true,
                name: true,
                email: true,
                image: true,
            },
        });

        return NextResponse.json(updatedUser);
    } catch (error) {
        console.error("[USER_ME_PATCH]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}


