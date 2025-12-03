import PusherServer from "pusher";
import PusherClient from "pusher-js";

// Server-side Pusher instance (used in API routes)
export const pusherServer = new PusherServer({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.PUSHER_CLUSTER || "mt1",
  useTLS: true,
});

// Client-side factory (used in React components)
export const createPusherClient = () => {
  if (typeof window === "undefined") return null;

  const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
  const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "mt1";

  if (!key) {
    console.warn("NEXT_PUBLIC_PUSHER_KEY is not set. Pusher will be disabled.");
    return null;
  }

  return new PusherClient(key, {
    cluster,
    // Used for private/presence channels authentication
    authEndpoint: "/api/pusher/auth",
    withCredentials: true,
  });
};

