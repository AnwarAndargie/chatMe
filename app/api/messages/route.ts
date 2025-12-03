import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { pusherServer } from "@/lib/pusher";

export async function GET(req: Request) {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const chatId = searchParams.get("chatId");

    if (!chatId) {
        return new NextResponse("Chat ID missing", { status: 400 });
    }

    try {
        const chat = await prisma.chatSession.findUnique({
            where: { id: chatId },
            select: { participantIds: true }
        });

        if (!chat || !chat.participantIds.includes(session.user.id)) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const messages = await prisma.message.findMany({
            where: {
                sessionId: chatId,
                isDeleted: false
            },
            include: {
                sender: {
                    select: {
                        id: true,
                        name: true,
                        image: true
                    }
                }
            },
            orderBy: {
                sentAt: 'asc'
            }
        });

        return NextResponse.json(messages);
    } catch (error) {
        console.log("[MESSAGES_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function POST(req: Request) {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const { content, chatId } = await req.json();

        if (!content || !chatId) {
            return new NextResponse("Missing content or chatId", { status: 400 });
        }

        const chat = await prisma.chatSession.findUnique({
            where: { id: chatId },
            select: { participantIds: true }
        });

        if (!chat || !chat.participantIds.includes(session.user.id)) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const message = await prisma.message.create({
            data: {
                content,
                sessionId: chatId,
                senderId: session.user.id,
            },
            include: {
                sender: {
                    select: {
                        id: true,
                        name: true,
                        image: true
                    }
                }
            }
        });

        await prisma.chatSession.update({
            where: { id: chatId },
            data: {
                lastMessageAt: new Date()
            }
        });

        // Broadcast the new message via Pusher
        await pusherServer.trigger(`chat-${chatId}`, "message:new", {
            id: message.id,
            content: message.content,
            sentAt: message.sentAt,
            isEdited: message.isEdited,
            editedAt: message.editedAt,
            senderId: message.senderId,
            sender: message.sender,
        });

        return NextResponse.json(message);

    } catch (error) {
        console.log("[MESSAGES_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
