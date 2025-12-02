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
        const chats = await prisma.chatSession.findMany({
            where: {
                participantIds: {
                    has: session.user.id
                }
            },
            include: {
                participants: {
                    select: {
                        id: true,
                        name: true,
                        image: true,
                        isOnline: true,
                        lastSeen: true
                    }
                },
                messages: {
                    orderBy: {
                        sentAt: 'desc'
                    },
                    take: 1
                }
            },
            orderBy: {
                lastMessageAt: 'desc'
            }
        });

        return NextResponse.json(chats);
    } catch (error) {
        console.log("[CHATS_GET]", error);
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
        const { userId } = await req.json();

        if (!userId) {
            return new NextResponse("User ID missing", { status: 400 });
        }

        const existingChat = await prisma.chatSession.findFirst({
            where: {
                AND: [
                    { participantIds: { has: session.user.id } },
                    { participantIds: { has: userId } }
                ]
            },
            include: {
                participants: true
            }
        });

        if (existingChat) {
            return NextResponse.json(existingChat);
        }

        const newChat = await prisma.chatSession.create({
            data: {
                participantIds: [session.user.id, userId],
                participants: {
                    connect: [
                        { id: session.user.id },
                        { id: userId }
                    ]
                }
            },
            include: {
                participants: true
            }
        });

        return NextResponse.json(newChat);

    } catch (error) {
        console.log("[CHATS_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
