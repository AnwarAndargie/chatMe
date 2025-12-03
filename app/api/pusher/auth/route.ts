import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { pusherServer } from "@/lib/pusher";

export async function POST(req: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    console.warn("[PusherAuth] Unauthorized auth attempt.");
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const body = await req.text();
  const params = new URLSearchParams(body);

  const socketId = params.get("socket_id");
  const channelName = params.get("channel_name");

  if (!socketId || !channelName) {
    console.warn("[PusherAuth] Missing socket_id or channel_name.", {
      socketId,
      channelName,
    });
    return new NextResponse("Bad Request", { status: 400 });
  }

  console.log("[PusherAuth] Authorizing presence/channel:", {
    socketId,
    channelName,
    userId: session.user.id,
  });

  const presenceData = {
    user_id: session.user.id,
    user_info: {
      name: session.user.name,
      image: session.user.image,
    },
  };

  const authResponse = pusherServer.authorizeChannel(
    socketId,
    channelName,
    presenceData,
  );

  return NextResponse.json(authResponse);
}


