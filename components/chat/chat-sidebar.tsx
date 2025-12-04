"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { Search, Menu } from "lucide-react";
import type { User } from "@/lib/mock-users";
import { UserListItem } from "@/components/chat/user-list-item";
import { UserProfileSheet } from "@/components/chat/user-profile-sheet";
import { ConversationFilters, type ConversationFilter } from "@/components/chat/conversation-filters";
import {
    Sidebar,
    SidebarContent,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuItem,
    useSidebar,
} from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { usePusher } from "@/components/providers/pusher-provider";
import type PusherClient from "pusher-js";
import type { Channel, PresenceChannel } from "pusher-js";

interface ApiUser {
    id: string;
    name: string;
    image?: string | null;
    isOnline?: boolean;
    lastSeen?: string | null;
}

interface ChatPreviewResponse {
    id: string;
    lastMessageAt: string | null;
    unreadCount: number;
    lastMessage: {
        id: string;
        content: string;
        sentAt: string;
        senderId: string;
    } | null;
    participant: {
        id: string;
        name: string;
        image: string | null;
        isOnline: boolean;
        lastSeen: string | null;
    };
}

interface PresenceMember {
    id: string;
}

interface ChatListEntry {
    chatId?: string;
    user: User;
    unreadCount: number;
    lastMessage?: {
        id: string;
        content: string;
        sentAt: Date;
        senderId: string;
    } | null;
    lastMessageAt?: Date | null;
}

interface ChatSidebarProps {
    selectedUserId?: string;
    onSelectUser: (user: User) => void;
}

const sortChatEntries = (entries: ChatListEntry[]) =>
    [...entries].sort((a, b) => {
        const aTime = a.lastMessageAt ? a.lastMessageAt.getTime() : 0;
        const bTime = b.lastMessageAt ? b.lastMessageAt.getTime() : 0;

        if (aTime === bTime) {
            return a.user.name.localeCompare(b.user.name);
        }

        return bTime - aTime;
    });

const transformApiUser = (user: ApiUser): User => ({
    id: user.id,
    name: user.name,
    avatar: user.image || undefined,
    online: Boolean(user.isOnline),
    lastSeen: user.lastSeen ? new Date(user.lastSeen) : undefined,
});

export function ChatSidebar({ selectedUserId, onSelectUser }: ChatSidebarProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [profileSheetOpen, setProfileSheetOpen] = useState(false);
    const [activeFilter, setActiveFilter] = useState<ConversationFilter>("all");
    const { isMobile, setOpenMobile } = useSidebar();
    const { pusher } = usePusher();

    const [chatEntries, setChatEntries] = useState<ChatListEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const markReadRequests = useRef<Set<string>>(new Set());
    const chatSubscriptionsRef = useRef<Record<string, { channel: Channel; handler: (payload: any) => void }>>({});

    const updateChatEntries = useCallback((updater: (prev: ChatListEntry[]) => ChatListEntry[]) => {
        setChatEntries((prev) => sortChatEntries(updater(prev)));
    }, []);

    const fetchSidebarData = useCallback(async (showLoader = false) => {
        if (showLoader) {
            setIsLoading(true);
        }
        try {
            const [usersResponse, chatsResponse] = await Promise.all([
                fetch("/api/users"),
                fetch("/api/chats"),
            ]);

            if (!usersResponse.ok || !chatsResponse.ok) {
                console.error("[Sidebar] Failed to fetch sidebar data.", {
                    usersStatus: usersResponse.status,
                    chatsStatus: chatsResponse.status,
                });
                return;
            }

            const [usersData, chatsData]: [ApiUser[], ChatPreviewResponse[]] = await Promise.all([
                usersResponse.json(),
                chatsResponse.json(),
            ]);

            const entryMap = new Map<string, ChatListEntry>();

            usersData.forEach((user) => {
                entryMap.set(user.id, {
                    user: transformApiUser(user),
                    unreadCount: 0,
                    chatId: undefined,
                    lastMessage: undefined,
                    lastMessageAt: undefined,
                });
            });

            chatsData.forEach((chat) => {
                const participantUser = transformApiUser({
                    id: chat.participant.id,
                    name: chat.participant.name,
                    image: chat.participant.image,
                    isOnline: chat.participant.isOnline,
                    lastSeen: chat.participant.lastSeen,
                });

                const existing = entryMap.get(participantUser.id);

                entryMap.set(participantUser.id, {
                    chatId: chat.id,
                    unreadCount: chat.unreadCount,
                    user: {
                        ...(existing?.user ?? participantUser),
                        ...participantUser,
                    },
                    lastMessage: chat.lastMessage
                        ? {
                            ...chat.lastMessage,
                            sentAt: new Date(chat.lastMessage.sentAt),
                        }
                        : undefined,
                    lastMessageAt: chat.lastMessageAt ? new Date(chat.lastMessageAt) : undefined,
                });
            });

            setChatEntries(sortChatEntries(Array.from(entryMap.values())));
        } catch (error) {
            console.error("[Sidebar] Failed to load sidebar data:", error);
        } finally {
            if (showLoader) {
                setIsLoading(false);
            }
        }
    }, []);

    useEffect(() => {
        fetchSidebarData(true);
    }, [fetchSidebarData]);

    // Close sidebar on mobile when a user is selected
    useEffect(() => {
        if (isMobile && selectedUserId) {
            setOpenMobile(false);
        }
    }, [selectedUserId, isMobile, setOpenMobile]);

    const markChatAsRead = useCallback(
        async (chatId: string | undefined) => {
            if (!chatId || markReadRequests.current.has(chatId)) {
                return;
            }

            markReadRequests.current.add(chatId);

            try {
                const response = await fetch("/api/messages/read", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ chatId }),
                });

                if (!response.ok) {
                    console.error("[Sidebar] Failed to mark chat as read.", response.status);
                    return;
                }

                updateChatEntries((entries) =>
                    entries.map((entry) =>
                        entry.chatId === chatId
                            ? {
                                ...entry,
                                unreadCount: 0,
                            }
                            : entry,
                    ),
                );
            } catch (error) {
                console.error("[Sidebar] Error marking chat as read:", error);
            } finally {
                markReadRequests.current.delete(chatId);
            }
        },
        [updateChatEntries],
    );

    // Keep online status (and lastSeen) in sync via Pusher presence channel
    useEffect(() => {
        if (!pusher) {
            console.warn("[Sidebar] No Pusher client available for presence channel.");
            return;
        }

        const presenceChannel = (pusher as PusherClient).subscribe("presence-users") as PresenceChannel;
        console.log("[Sidebar] Subscribed to presence-users channel.");

        const updateOnlineFromMembers = () => {
            const onlineUserIds: string[] = [];

            const members = presenceChannel.members as unknown as {
                each: (callback: (member: PresenceMember) => void) => void;
            };

            members.each((member) => {
                if (member?.id) {
                    onlineUserIds.push(member.id);
                }
            });

            updateChatEntries((prevEntries) =>
                prevEntries.map((entry) => {
                    const isOnline = onlineUserIds.includes(entry.user.id);
                    const wasOnline = entry.user.online;
                    return {
                        ...entry,
                        user: {
                            ...entry.user,
                            online: isOnline,
                            lastSeen: !isOnline && wasOnline ? new Date() : entry.user.lastSeen,
                        },
                    };
                }),
            );
        };

        presenceChannel.bind("pusher:subscription_succeeded", updateOnlineFromMembers);
        presenceChannel.bind("pusher:member_added", updateOnlineFromMembers);
        presenceChannel.bind("pusher:member_removed", updateOnlineFromMembers);

        return () => {
            console.log("[Sidebar] Cleaning up presence-users bindings.");
            presenceChannel.unbind("pusher:subscription_succeeded", updateOnlineFromMembers);
            presenceChannel.unbind("pusher:member_added", updateOnlineFromMembers);
            presenceChannel.unbind("pusher:member_removed", updateOnlineFromMembers);
            // Do not unsubscribe here to avoid affecting other components using the same channel
        };
    }, [pusher, updateChatEntries]);

    const handleIncomingMessage = useCallback(
        (chatId: string, payload: { id: string; content: string; sentAt: string; senderId: string }) => {
            let shouldRefresh = false;
            let shouldMarkRead = false;

            updateChatEntries((prevEntries) => {
                let found = false;

                const nextEntries = prevEntries.map((entry) => {
                    if (entry.chatId !== chatId) {
                        return entry;
                    }

                    found = true;
                    const sentAtDate = new Date(payload.sentAt);
                    const incomingFromParticipant = payload.senderId === entry.user.id;
                    const isActiveChat = selectedUserId === entry.user.id;
                    const nextUnreadCount =
                        incomingFromParticipant && !isActiveChat
                            ? entry.unreadCount + 1
                            : entry.unreadCount;

                    if (incomingFromParticipant && isActiveChat) {
                        shouldMarkRead = true;
                    }

                    return {
                        ...entry,
                        lastMessage: {
                            id: payload.id,
                            content: payload.content,
                            sentAt: sentAtDate,
                            senderId: payload.senderId,
                        },
                        lastMessageAt: sentAtDate,
                        unreadCount: incomingFromParticipant ? nextUnreadCount : entry.unreadCount,
                    };
                });

                if (!found) {
                    shouldRefresh = true;
                }

                return nextEntries;
            });

            if (shouldRefresh) {
                fetchSidebarData();
            } else if (shouldMarkRead) {
                markChatAsRead(chatId);
            }
        },
        [selectedUserId, updateChatEntries, fetchSidebarData, markChatAsRead],
    );

    useEffect(() => {
        if (!pusher) {
            return;
        }

        const subscriptions = chatSubscriptionsRef.current;
        const nextChatIds = new Set(
            chatEntries
                .map((entry) => entry.chatId)
                .filter((chatId): chatId is string => Boolean(chatId)),
        );

        nextChatIds.forEach((chatId) => {
            if (subscriptions[chatId]) {
                return;
            }

            const channel = (pusher as PusherClient).subscribe(`chat-${chatId}`);
            const handler = (payload: { id: string; content: string; sentAt: string; senderId: string }) =>
                handleIncomingMessage(chatId, payload);

            channel.bind("message:new", handler);
            subscriptions[chatId] = { channel, handler };
        });

        Object.keys(subscriptions).forEach((chatId) => {
            if (!nextChatIds.has(chatId)) {
                const subscription = subscriptions[chatId];
                subscription.channel.unbind("message:new", subscription.handler);
                (pusher as PusherClient).unsubscribe(`chat-${chatId}`);
                delete subscriptions[chatId];
            }
        });
    }, [pusher, chatEntries, handleIncomingMessage]);

    useEffect(() => {
        return () => {
            const subscriptions = chatSubscriptionsRef.current;
            Object.keys(subscriptions).forEach((chatId) => {
                const subscription = subscriptions[chatId];
                subscription.channel.unbind("message:new", subscription.handler);
                if (pusher) {
                    (pusher as PusherClient).unsubscribe(`chat-${chatId}`);
                }
            });
            chatSubscriptionsRef.current = {};
        };
    }, [pusher]);

    useEffect(() => {
        if (!selectedUserId) {
            return;
        }

        const activeEntry = chatEntries.find((entry) => entry.user.id === selectedUserId);

        if (activeEntry?.chatId && activeEntry.unreadCount > 0) {
            markChatAsRead(activeEntry.chatId);
        }
    }, [selectedUserId, chatEntries, markChatAsRead]);

    const filteredEntries = useMemo(() => {
        const query = searchQuery.toLowerCase().trim();
        let filtered = chatEntries;

        if (query) {
            filtered = filtered.filter((entry) =>
                entry.user.name.toLowerCase().includes(query),
            );
        }

        if (activeFilter === "online") {
            filtered = filtered.filter((entry) => entry.user.online);
        }

        return filtered;
    }, [chatEntries, searchQuery, activeFilter]);

    const totalUnread = useMemo(
        () => chatEntries.reduce((sum, entry) => sum + entry.unreadCount, 0),
        [chatEntries],
    );

    const handleUserSelect = (user: User) => {
        onSelectUser(user);
    };

    return (
        <>
            <Sidebar collapsible="offcanvas" className="border-r">
                <SidebarHeader className="border-b p-3 space-y-3">
                    {/* Hamburger Menu and Title */}
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 shrink-0"
                            onClick={() => setProfileSheetOpen(true)}
                        >
                            <Menu className="h-5 w-5" />
                            <span className="sr-only">Open menu</span>
                        </Button>
                        <h2 className="text-lg font-semibold">Chats</h2>
                    </div>

                    {/* Search Bar */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="text"
                            placeholder="Search users..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 h-9"
                        />
                    </div>

                    <ConversationFilters
                        activeFilter={activeFilter}
                        onFilterChange={setActiveFilter}
                        unreadCount={totalUnread}
                    />
                </SidebarHeader>

                <SidebarContent>
                    <SidebarMenu>
                        {isLoading ? (
                            // Loading skeleton state
                            Array.from({ length: 5 }).map((_, index) => (
                                <SidebarMenuItem key={`skeleton-${index}`} className="list-none">
                                    <div className="w-full flex items-center gap-3 px-4 py-3">
                                        <div className="relative">
                                            <Skeleton className="h-12 w-12 rounded-full" />
                                            <Skeleton className="absolute bottom-0 right-0 h-3 w-3 rounded-full border border-background" />
                                        </div>
                                        <div className="flex-1 space-y-2">
                                            <Skeleton className="h-4 w-3/4" />
                                            <Skeleton className="h-3 w-1/2" />
                                        </div>
                                    </div>
                                </SidebarMenuItem>
                            ))
                        ) : filteredEntries.length === 0 ? (
                            <div className="text-center py-8 px-4">
                                <p className="text-sm text-muted-foreground">
                                    {searchQuery
                                        ? "No users found"
                                        : activeFilter === "online"
                                            ? "No online users"
                                            : "No users available"}
                                </p>
                            </div>
                        ) : (
                            filteredEntries.map((entry) => (
                                <SidebarMenuItem key={entry.user.id} className="list-none">
                                    <UserListItem
                                        user={entry.user}
                                        isActive={selectedUserId === entry.user.id}
                                        onClick={() => handleUserSelect(entry.user)}
                                        unreadCount={entry.unreadCount}
                                        lastMessage={entry.lastMessage ?? undefined}
                                        lastMessageAt={entry.lastMessageAt ?? undefined}
                                    />
                                </SidebarMenuItem>
                            ))
                        )}
                    </SidebarMenu>
                </SidebarContent>
            </Sidebar>

            {/* User Profile Sheet */}
            <UserProfileSheet
                open={profileSheetOpen}
                onOpenChange={setProfileSheetOpen}
            />
        </>
    );
}
