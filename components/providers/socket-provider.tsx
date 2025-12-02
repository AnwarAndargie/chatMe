"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import io from "socket.io-client";
import type { Socket } from "socket.io-client";
import { authClient } from "@/lib/auth-client";

interface SocketContextType {
    socket: Socket | null;
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
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        const initSocket = async () => {
            // Get current user session
            const { data: session } = await authClient.getSession();

            if (!session?.user?.id) {
                console.log("No user session, skipping socket connection");
                return;
            }

            // Update user status to online
            try {
                await fetch("/api/user/status", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ isOnline: true }),
                });
            } catch (error) {
                console.error("Failed to update online status:", error);
            }

            // Connect to the custom server on port 3005
            const socketInstance = io("http://localhost:3005", {
                path: "/socket.io",
            });

            socketInstance.on("connect", () => {
                console.log("Connected to socket server");
                setIsConnected(true);

                // Authenticate user with socket
                socketInstance.emit("authenticate", { userId: session.user.id });
            });

            socketInstance.on("disconnect", () => {
                console.log("Disconnected from socket server");
                setIsConnected(false);
            });

            setSocket(socketInstance);

            return () => {
                // Update user status to offline before disconnecting
                fetch("/api/user/status", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ isOnline: false }),
                }).catch(console.error);

                socketInstance.disconnect();
            };
        };

        initSocket();
    }, []);

    return (
        <SocketContext.Provider value={{ socket, isConnected }}>
            {children}
        </SocketContext.Provider>
    );
};