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

import { authClient } from "@/lib/auth-client";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";

interface UserProfileSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function UserProfileSheet({ open, onOpenChange }: UserProfileSheetProps) {
    const router = useRouter();
    const { data: session, isPending } = authClient.useSession();
    const user = session?.user;

    const initials = user?.name
        ? user.name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
        : "??";

    const logout = async () => {
        await authClient.signOut({
            fetchOptions: {
                onSuccess: () => {
                    router.push("/");
                },
            },
        });
    };

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
                        {isPending ? (
                            <Skeleton className="h-24 w-24 rounded-full" />
                        ) : (
                            <Avatar className="h-24 w-24">
                                <AvatarImage src={user?.image || ""} alt={user?.name || "User"} />
                                <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                                    {initials}
                                </AvatarFallback>
                            </Avatar>
                        )}

                        <div>
                            {isPending ? (
                                <div className="space-y-2">
                                    <Skeleton className="h-6 w-32 mx-auto" />
                                    <Skeleton className="h-4 w-48 mx-auto" />
                                </div>
                            ) : (
                                <>
                                    <h3 className="text-xl font-semibold">{user?.name || "Guest"}</h3>
                                    <p className="text-sm text-muted-foreground flex items-center justify-center gap-1 mt-1">
                                        <Mail className="h-3 w-3" />
                                        {user?.email || "No email"}
                                    </p>
                                </>
                            )}
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
                                logout();
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
