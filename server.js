import "dotenv/config";
import { Server } from "socket.io";
// Import TypeScript modules directly; these are executed via `tsx` in dev
import prisma from "./lib/prisma.ts";
import {
  markUserOnline,
  markUserOffline,
  getOnlineUsers,
} from "./lib/redis.ts";

// Use a dedicated socket port, defaulting to 3005 to match the frontend
const PORT = Number(process.env.SOCKET_PORT || process.env.PORT || 3005);

const io = new Server({
  cors: {
    origin: "*", // Change to your frontend URL in prod
    methods: ["GET", "POST"],
  },
});

console.log("Socket.io server starting...");
console.log("Redis URL:", process.env.UPSTASH_REDIS_REST_URL?.slice(0, 30) + "...");
console.log("Redis Token exists:", !!process.env.UPSTASH_REDIS_REST_TOKEN);

io.on("connection", (socket) => {
  console.log("New connection:", socket.id);

  let userId = null;

  socket.on("authenticate", async (data) => {
    if (!data?.userId) {
      socket.disconnect(true);
      return;
    }

    userId = data.userId;

    try {
      await markUserOnline(userId);
      await prisma.user.update({
        where: { id: userId },
        data: { isOnline: true, lastSeen: new Date() },
      });

      const onlineUsers = await getOnlineUsers();
      io.emit("onlineUsers", onlineUsers);

      console.log(`User ${userId} is online (${onlineUsers.length} total)`);
    } catch (error) {
      console.error("Failed to mark user online:", error);
      socket.disconnect(true);
    }
  });

  socket.on("join-room", (sessionId) => {
    socket.join(sessionId);
  });

  socket.on("send-message", (message) => {
    if (!message.sessionId) return;

    io.to(message.sessionId).emit("receive-message", {
      ...message,
      sentAt: new Date().toISOString(),
    });
  });

  socket.on("typing", ({ sessionId, isTyping }) => {
    socket.to(sessionId).emit("user-typing", { userId, isTyping });
  });

  socket.on("heartbeat", async () => {
    if (userId) await markUserOnline(userId); // Refresh TTL
  });

  socket.on("disconnect", async () => {
    if (!userId) return;

    console.log(`User ${userId} disconnected`);

    try {
      await markUserOffline(userId);
      await prisma.user.update({
        where: { id: userId },
        data: { isOnline: false, lastSeen: new Date() },
      });

      const updated = await getOnlineUsers();
      io.emit("onlineUsers", updated);
    } catch (error) {
      console.error("Error during disconnect cleanup:", error);
    }
  });
});

io.listen(PORT, () => {
  console.log(`Socket.io server running on http://localhost:${PORT}`);
});