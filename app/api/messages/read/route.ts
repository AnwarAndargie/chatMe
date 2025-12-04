import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const { chatId } = await req.json();

        if (!chatId || typeof chatId !== "string") {
            return new NextResponse("Chat ID missing", { status: 400 });
        }

        const chat = await prisma.chatSession.findFirst({
            where: {
                id: chatId,
                participantIds: {
                    has: session.user.id,
                },
            },
            select: {
                id: true,
            },
        });

        if (!chat) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const result = await prisma.message.updateMany({
            where: {
                sessionId: chatId,
                senderId: {
                    not: session.user.id,
                },
                isRead: false,
                isDeleted: false,
            },
            data: {
                isRead: true,
            },
        });

        return NextResponse.json({ updatedCount: result.count });
    } catch (error) {
        console.log("[MESSAGES_READ_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}


