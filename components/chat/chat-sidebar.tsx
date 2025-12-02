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
} from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface ChatSidebarProps {
    selectedUserId?: string;
    onSelectUser: (user: User) => void;
}

export function ChatSidebar({ selectedUserId, onSelectUser }: ChatSidebarProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [profileSheetOpen, setProfileSheetOpen] = useState(false);
    const [activeFilter, setActiveFilter] = useState<ConversationFilter>("all");

    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await fetch("/api/users");
                if (response.ok) {
                    const data = await response.json();
                    setUsers(data);
                }
            } catch (error) {
                console.error("Failed to fetch users:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchUsers();
    }, []);

    const filteredUsers = useMemo(() => {
        const query = searchQuery.toLowerCase().trim();
        let filtered = users;

        if (query) {
            filtered = filtered.filter((user) =>
                user.name.toLowerCase().includes(query)
            );
        }

        if (activeFilter === "unread") {
            filtered = filtered.filter((user) => user.online);
        }

        return filtered;
    }, [users, searchQuery, activeFilter]);

    return (
        <>
            <Sidebar collapsible="none" className="border-r">
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
                        {filteredUsers.length === 0 ? (
                            <div className="text-center py-8 px-4">
                                <p className="text-sm text-muted-foreground">
                                    {searchQuery
                                        ? "No users found"
                                        : activeFilter === "unread"
                                            ? "No unread conversations"
                                            : "No users available"}
                                </p>
                            </div>
                        ) : (
                            filteredUsers.map((user) => (
                                <SidebarMenuItem key={user.id} className="list-none">
                                    <UserListItem
                                        user={user}
                                        isActive={selectedUserId === user.id}
                                        onClick={() => onSelectUser(user)}
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
