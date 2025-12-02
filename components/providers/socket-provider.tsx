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

            // Connect to the standalone Socket.IO server
            const socketUrl =
                process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3005";

            const socketInstance = io(socketUrl, {
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