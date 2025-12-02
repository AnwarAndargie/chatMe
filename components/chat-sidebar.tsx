"use client";

import { useState, useMemo } from "react";
import { Search } from "lucide-react";
import type { User } from "@/lib/mock-users";
import { mockUsers } from "@/lib/mock-users";
import { UserListItem } from "@/components/user-list-item";
import {
    Sidebar,
    SidebarContent,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";

interface ChatSidebarProps {
    selectedUserId?: string;
    onSelectUser: (user: User) => void;
}

export function ChatSidebar({ selectedUserId, onSelectUser }: ChatSidebarProps) {
    const [searchQuery, setSearchQuery] = useState("");

    const filteredUsers = useMemo(() => {
        const query = searchQuery.toLowerCase().trim();
        if (!query) return mockUsers;

        return mockUsers.filter((user) =>
            user.name.toLowerCase().includes(query)
        );
    }, [searchQuery]);

    return (
        <Sidebar collapsible="none" className="border-r">
            <SidebarHeader className="border-b p-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="text"
                        placeholder="Search users..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 h-10"
                    />
                </div>
            </SidebarHeader>

            <SidebarContent>
                <SidebarMenu>
                    {filteredUsers.length === 0 ? (
                        <div className="text-center py-8 px-4">
                            <p className="text-sm text-muted-foreground">No users found</p>
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
    );
}
