"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { Socket } from "socket.io-client";

interface SocketContextType {
    socket: typeof Socket | null;
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
    const [socket, setSocket] = useState<typeof Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        // Connect to the custom server on port 3005
        const socketInstance = io("http://localhost:3005", {
            path: "/socket.io",
        });

        socketInstance.on("connect", () => {
            console.log("Connected to socket server");
            setIsConnected(true);
        });

        socketInstance.on("disconnect", () => {
            console.log("Disconnected from socket server");
            setIsConnected(false);
        });

        setSocket(socketInstance);

        return () => {
            socketInstance.disconnect();
        };
    }, []);

    return (
        <SocketContext.Provider value={{ socket, isConnected }}>
            {children}
        </SocketContext.Provider>
    );
};