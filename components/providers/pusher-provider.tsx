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
  const [pusher] = useState<PusherClient | null>(() => {
    console.log("[Pusher] Initializing client...");
    return createPusherClient();
  });

  useEffect(() => {
    if (!pusher) {
      console.warn("[Pusher] Client not created. Check NEXT_PUBLIC_PUSHER_KEY / CLUSTER.");
      return;
    }

    console.log("[Pusher] Client created. Attempting to connect...");

    pusher.connection.bind("state_change", (states: { previous: string; current: string }) => {
      console.log("[Pusher] Connection state change:", states);
    });

    pusher.connection.bind("error", (err: unknown) => {
      console.error("[Pusher] Connection error:", err);
    });

    return () => {
      console.log("[Pusher] Disconnecting client...");
      pusher.disconnect();
    };
  }, [pusher]);

  return (
    <PusherContext.Provider value={{ pusher }}>
      {children}
    </PusherContext.Provider>
  );
};


