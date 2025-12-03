"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import type PusherClient from "pusher-js";
import { createPusherClient } from "@/lib/pusher";

interface PusherContextType {
  pusher: PusherClient | null;
}

const PusherContext = createContext<PusherContextType>({
  pusher: null,
});

export const usePusher = () => useContext(PusherContext);

export const PusherProvider = ({ children }: { children: React.ReactNode }) => {
  const [pusher, setPusher] = useState<PusherClient | null>(null);

  useEffect(() => {
    console.log("[Pusher] Initializing client...");
    const instance = createPusherClient();

    if (!instance) {
      console.warn("[Pusher] Client not created. Check NEXT_PUBLIC_PUSHER_KEY / CLUSTER.");
    } else {
      console.log("[Pusher] Client created. Attempting to connect...");
      instance.connection.bind("state_change", (states: any) => {
        console.log("[Pusher] Connection state change:", states);
      });

      instance.connection.bind("error", (err: any) => {
        console.error("[Pusher] Connection error:", err);
      });
    }

    setPusher(instance);

    return () => {
      console.log("[Pusher] Disconnecting client...");
      instance?.disconnect();
    };
  }, []);

  return (
    <PusherContext.Provider value={{ pusher }}>
      {children}
    </PusherContext.Provider>
  );
};


