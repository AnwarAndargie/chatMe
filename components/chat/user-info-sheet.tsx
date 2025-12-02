"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
    Phone,
    Video,
    Bell,
    BellOff,
    Search,
    Trash2,
    Ban,
    Info
} from "lucide-react";
import type { User } from "@/lib/mock-users";

interface UserInfoSheetProps {
    user: User | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function UserInfoSheet({ user, open, onOpenChange }: UserInfoSheetProps) {
    if (!user) return null;

    const initials = user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase();

    const getLastSeenText = () => {
        if (user.online) return "Online";
        if (!user.lastSeen) return "Last seen recently";

        const now = new Date();
        const lastSeenDate = new Date(user.lastSeen);
        const diff = now.getTime() - lastSeenDate.getTime();
        const minutes = Math.floor(diff / 1000 / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (minutes < 1) return "Last seen just now";
        if (minutes < 60) return `Last seen ${minutes} minute${minutes > 1 ? 's' : ''} ago`;
        if (hours < 24) return `Last seen ${hours} hour${hours > 1 ? 's' : ''} ago`;
        return `Last seen ${days} day${days > 1 ? 's' : ''} ago`;
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="w-96 p-0">
                <div className="flex flex-col h-full">
                    {/* Header with Avatar */}
                    <div className="p-6 text-center space-y-4">
                        <Avatar className="h-32 w-32 mx-auto">
                            <AvatarImage src={user.avatar || undefined} alt={user.name} />
                            <AvatarFallback className="bg-primary text-primary-foreground text-4xl">
                                {initials}
                            </AvatarFallback>
                        </Avatar>

                        <div>
                            <SheetTitle className="text-2xl">{user.name}</SheetTitle>
                            <SheetDescription className="text-base mt-1">
                                {getLastSeenText()}
                            </SheetDescription>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="px-4 pb-4 grid grid-cols-3 gap-2">
                        <Button
                            variant="outline"
                            className="flex flex-col h-auto py-3 gap-1"
                            onClick={() => console.log("Call", user.name)}
                        >
                            <Phone className="h-5 w-5" />
                            <span className="text-xs">Call</span>
                        </Button>
                        <Button
                            variant="outline"
                            className="flex flex-col h-auto py-3 gap-1"
                            onClick={() => console.log("Video call", user.name)}
                        >
                            <Video className="h-5 w-5" />
                            <span className="text-xs">Video</span>
                        </Button>
                        <Button
                            variant="outline"
                            className="flex flex-col h-auto py-3 gap-1"
                            onClick={() => console.log("Search messages", user.name)}
                        >
                            <Search className="h-5 w-5" />
                            <span className="text-xs">Search</span>
                        </Button>
                    </div>

                    <Separator />

                    {/* Info Section */}
                    <div className="flex-1 overflow-auto">
                        <div className="p-4 space-y-1">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                                <Info className="h-4 w-4" />
                                <span className="font-medium">Info</span>
                            </div>
                            <div className="pl-6 space-y-2">
                                <div>
                                    <p className="text-xs text-muted-foreground">Username</p>
                                    <p className="text-sm">@{user.name.toLowerCase().replace(/\s+/g, '')}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">Bio</p>
                                    <p className="text-sm">Available for chat</p>
                                </div>
                            </div>
                        </div>

                        <Separator />

                        {/* Settings & Actions */}
                        <div className="p-2 space-y-1">
                            <Button
                                variant="ghost"
                                className="w-full justify-start"
                                onClick={() => console.log("Toggle notifications")}
                            >
                                <Bell className="h-4 w-4 mr-3" />
                                Notifications
                            </Button>
                            <Button
                                variant="ghost"
                                className="w-full justify-start"
                                onClick={() => console.log("Mute")}
                            >
                                <BellOff className="h-4 w-4 mr-3" />
                                Mute
                            </Button>
                        </div>

                        <Separator />

                        {/* Danger Zone */}
                        <div className="p-2 space-y-1">
                            <Button
                                variant="ghost"
                                className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() => console.log("Block user")}
                            >
                                <Ban className="h-4 w-4 mr-3" />
                                Block User
                            </Button>
                            <Button
                                variant="ghost"
                                className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() => console.log("Delete chat")}
                            >
                                <Trash2 className="h-4 w-4 mr-3" />
                                Delete Chat
                            </Button>
                        </div>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
