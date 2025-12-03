import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { pusherServer } from "@/lib/pusher";

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ messageId: string }> }
) {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const { messageId } = await params;
        const { content } = await req.json();

        if (!content || !content.trim()) {
            return new NextResponse("Content is required", { status: 400 });
        }

        // Find the message and verify ownership
        const message = await prisma.message.findUnique({
            where: { id: messageId }
        });

        if (!message) {
            return new NextResponse("Message not found", { status: 404 });
        }

        if (message.senderId !== session.user.id) {
            return new NextResponse("Forbidden", { status: 403 });
        }

        if (message.isDeleted) {
            return new NextResponse("Cannot edit deleted message", { status: 400 });
        }

        // Update the message
        const updatedMessage = await prisma.message.update({
            where: { id: messageId },
            data: {
                content: content.trim(),
                isEdited: true,
                editedAt: new Date()
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

        // Broadcast the edited message via Pusher
        await pusherServer.trigger(`chat-${message.sessionId}`, "message:edited", {
            messageId: updatedMessage.id,
            content: updatedMessage.content,
            isEdited: updatedMessage.isEdited,
            editedAt: updatedMessage.editedAt,
        });

        return NextResponse.json(updatedMessage);
    } catch (error) {
        console.log("[MESSAGE_PATCH]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ messageId: string }> }
) {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const { messageId } = await params;

        // Find the message and verify ownership
        const message = await prisma.message.findUnique({
            where: { id: messageId }
        });

        if (!message) {
            return new NextResponse("Message not found", { status: 404 });
        }

        if (message.senderId !== session.user.id) {
            return new NextResponse("Forbidden", { status: 403 });
        }

        // Soft delete the message
        await prisma.message.update({
            where: { id: messageId },
            data: {
                isDeleted: true,
                deletedAt: new Date()
            }
        });

        // Broadcast the deletion via Pusher
        await pusherServer.trigger(`chat-${message.sessionId}`, "message:deleted", {
            messageId,
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.log("[MESSAGE_DELETE]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
