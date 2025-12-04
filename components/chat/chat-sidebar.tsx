"use client";

import { useState, useMemo, useEffect } from "react";
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
import type { PresenceChannel } from "pusher-js";

interface ApiUser {
    id: string;
    name: string;
    image?: string | null;
    lastSeen?: string | null;
}

interface PresenceMember {
    id: string;
}

interface ChatSidebarProps {
    selectedUserId?: string;
    onSelectUser: (user: User) => void;
}

export function ChatSidebar({ selectedUserId, onSelectUser }: ChatSidebarProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [profileSheetOpen, setProfileSheetOpen] = useState(false);
    const [activeFilter, setActiveFilter] = useState<ConversationFilter>("all");
    const { isMobile, setOpenMobile } = useSidebar();
    const { pusher } = usePusher();

    // Close sidebar on mobile when a user is selected
    useEffect(() => {
        if (isMobile && selectedUserId) {
            setOpenMobile(false);
        }
    }, [selectedUserId, isMobile, setOpenMobile]);

    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                console.log("[Sidebar] Fetching users for sidebar...");
                const response = await fetch("/api/users");
                if (response.ok) {
                    const data: ApiUser[] = await response.json();
                    // Transform API response to match User type.
                    // We ignore the DB isOnline flag and rely solely on Pusher presence.
                    const transformedUsers: User[] = data.map((user) => ({
                        id: user.id,
                        name: user.name,
                        avatar: user.image || undefined,
                        online: false,
                        lastSeen: user.lastSeen ? new Date(user.lastSeen) : undefined,
                    }));
                    setUsers(transformedUsers);
                    console.log("[Sidebar] Users loaded:", transformedUsers);
                } else {
                    console.error("[Sidebar] Failed to fetch users. Status:", response.status);
                }
            } catch (error) {
                console.error("[Sidebar] Failed to fetch users:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchUsers();
    }, []);

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

            console.log("[Sidebar] Presence members online IDs:", onlineUserIds);

            setUsers((prevUsers) =>
                prevUsers.map((user) => {
                    const isOnline = onlineUserIds.includes(user.id);
                    const wasOnline = user.online;
                    return {
                        ...user,
                        online: isOnline,
                        // If user just went offline, update lastSeen locally
                        lastSeen: !isOnline && wasOnline ? new Date() : user.lastSeen,
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
    }, [pusher]);

    const filteredUsers = useMemo(() => {
        const query = searchQuery.toLowerCase().trim();
        let filtered = users;

        if (query) {
            filtered = filtered.filter((user) =>
                user.name.toLowerCase().includes(query)
            );
        }

        if (activeFilter === "online") {
            filtered = filtered.filter((user) => user.online);
        }

        return filtered;
    }, [users, searchQuery, activeFilter]);

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
                        unreadCount={0}
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
                        ) : filteredUsers.length === 0 ? (
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
                            filteredUsers.map((user) => (
                                <SidebarMenuItem key={user.id} className="list-none">
                                    <UserListItem
                                        user={user}
                                        isActive={selectedUserId === user.id}
                                        onClick={() => handleUserSelect(user)}
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
