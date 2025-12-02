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
import { User, Mail, LogOut, Settings } from "lucide-react";

interface UserProfileSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

// Mock current user - in real app, this would come from auth context
const CURRENT_USER = {
    name: "John Doe",
    email: "john.doe@example.com",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=John",
};

export function UserProfileSheet({ open, onOpenChange }: UserProfileSheetProps) {
    const initials = CURRENT_USER.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase();

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="left" className="w-80">
                <SheetHeader>
                    <SheetTitle>Profile</SheetTitle>
                    <SheetDescription>
                        View and manage your profile information
                    </SheetDescription>
                </SheetHeader>

                <div className="mt-6 space-y-6">
                    {/* Profile Avatar and Info */}
                    <div className="flex flex-col items-center text-center space-y-4">
                        <Avatar className="h-24 w-24">
                            <AvatarImage src={CURRENT_USER.avatar} alt={CURRENT_USER.name} />
                            <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                                {initials}
                            </AvatarFallback>
                        </Avatar>

                        <div>
                            <h3 className="text-xl font-semibold">{CURRENT_USER.name}</h3>
                            <p className="text-sm text-muted-foreground flex items-center justify-center gap-1 mt-1">
                                <Mail className="h-3 w-3" />
                                {CURRENT_USER.email}
                            </p>
                        </div>
                    </div>

                    {/* Profile Actions */}
                    <div className="space-y-2">
                        <Button
                            variant="outline"
                            className="w-full justify-start"
                            onClick={() => {
                                // TODO: Navigate to profile edit
                                console.log("Edit profile");
                            }}
                        >
                            <User className="h-4 w-4 mr-2" />
                            Edit Profile
                        </Button>

                        <Button
                            variant="outline"
                            className="w-full justify-start"
                            onClick={() => {
                                // TODO: Navigate to settings
                                console.log("Settings");
                            }}
                        >
                            <Settings className="h-4 w-4 mr-2" />
                            Settings
                        </Button>

                        <Button
                            variant="outline"
                            className="w-full justify-start text-destructive hover:text-destructive"
                            onClick={() => {
                                // TODO: Handle logout
                                console.log("Logout");
                            }}
                        >
                            <LogOut className="h-4 w-4 mr-2" />
                            Logout
                        </Button>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
