"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import io from "socket.io-client";
import { authClient } from "@/lib/auth-client";

type SocketInstance = ReturnType<typeof io>;

interface SocketContextType {
    socket: SocketInstance | null;
    isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
    socket: null,
    isConnected: false,
});

export const useSocket = () => {
    return useContext(SocketContext);
};

export const SocketProvider = ({
    children,
}: {
    children: React.ReactNode;
}) => {
    const [socket, setSocket] = useState<SocketInstance | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        let socketInstance: SocketInstance | null = null;
        let isMounted = true;

        const initSocket = async () => {
            try {
                // Get current user session
                const { data: session } = await authClient.getSession();

                if (!session?.user?.id) {
                    console.log("No user session, skipping socket connection");
                    return;
                }

                if (!isMounted) return;

                // Connect to the standalone Socket.IO server
                const socketUrl =
                    process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3005";

                console.log("Initializing socket connection to:", socketUrl);

                socketInstance = io(socketUrl, {
                    path: "/socket.io",
                    reconnection: true,
                    reconnectionDelay: 1000,
                    reconnectionDelayMax: 5000,
                    reconnectionAttempts: Infinity,
                    timeout: 20000,
                    forceNew: false,
                });

                const authenticate = async () => {
                    try {
                        // Get fresh session on each authentication attempt
                        const { data: currentSession } = await authClient.getSession();
                        if (currentSession?.user?.id && socketInstance && socketInstance.connected) {
                            console.log("Authenticating user:", currentSession.user.id);
                            socketInstance.emit("authenticate", { userId: currentSession.user.id });
                        } else {
                            console.warn("Cannot authenticate: session or socket not available", {
                                hasSession: !!currentSession?.user?.id,
                                socketConnected: socketInstance?.connected,
                            });
                        }
                    } catch (error) {
                        console.error("Authentication error:", error);
                    }
                };

                socketInstance.on("connect", async () => {
                    console.log("✅ Connected to socket server, socket ID:", socketInstance?.id);
                    if (isMounted) {
                        setIsConnected(true);
                    }

                    // Authenticate user with socket
                    await authenticate();
                });

                socketInstance.on("reconnect", async (attemptNumber: number) => {
                    console.log(`✅ Reconnected to socket server (attempt ${attemptNumber}), socket ID:`, socketInstance?.id);
                    if (isMounted) {
                        setIsConnected(true);
                    }

                    // Re-authenticate on reconnect with fresh session
                    await authenticate();
                });

                socketInstance.on("reconnect_attempt", (attemptNumber: number) => {
                    console.log(`🔄 Reconnection attempt ${attemptNumber}`);
                });

                socketInstance.on("reconnect_error", (error: Error) => {
                    console.error("❌ Reconnection error:", error);
                });

                socketInstance.on("reconnect_failed", () => {
                    console.error("❌ Reconnection failed - all attempts exhausted");
                    if (isMounted) {
                        setIsConnected(false);
                    }
                });

                socketInstance.on("connect_error", (error: Error) => {
                    console.error("❌ Connection error:", error);
                    if (isMounted) {
                        setIsConnected(false);
                    }
                });

                socketInstance.on("disconnect", (reason: string) => {
                    console.log("⚠️ Disconnected from socket server. Reason:", reason);
                    if (isMounted) {
                        setIsConnected(false);
                    }
                    
                    // Socket.io will auto-reconnect for most disconnect reasons
                    // Only manually reconnect if server explicitly disconnected us
                    if (reason === "io server disconnect") {
                        console.log("Server disconnected us, will attempt to reconnect...");
                        // Socket.io should handle this automatically, but we can also manually trigger
                        setTimeout(() => {
                            if (socketInstance && !socketInstance.connected) {
                                console.log("Manually triggering reconnect...");
                                socketInstance.connect();
                            }
                        }, 1000);
                    }
                });

                if (isMounted) {
                    setSocket(socketInstance);
                }
            } catch (error) {
                console.error("Failed to initialize socket:", error);
            }
        };

        initSocket();

        // Cleanup function
        return () => {
            isMounted = false;
            if (socketInstance) {
                console.log("Cleaning up socket connection...");
                socketInstance.removeAllListeners();
                socketInstance.disconnect();
                socketInstance = null;
            }
        };
    }, []);

    return (
        <SocketContext.Provider value={{ socket, isConnected }}>
            {children}
        </SocketContext.Provider>
    );
};