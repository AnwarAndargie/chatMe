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
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/chat/theme-toggle";

interface UserProfileSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function UserProfileSheet({ open, onOpenChange }: UserProfileSheetProps) {
    const router = useRouter();
    const { data: session, isPending } = authClient.useSession();
    const user = session?.user;

    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [name, setName] = useState(user?.name ?? "");
    const [image, setImage] = useState(user?.image ?? "");
    const [error, setError] = useState<string | null>(null);

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
                    <SheetTitle>{isEditing ? "Edit Profile" : "Profile"}</SheetTitle>
                    <SheetDescription>
                        {isEditing
                            ? "Update your profile details"
                            : "View and manage your profile information"}
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

                    {/* Profile Actions / Edit Form */}
                    {isEditing ? (
                        <form
                            className="space-y-4"
                            onSubmit={async (e) => {
                                e.preventDefault();
                                setError(null);
                                setIsSaving(true);
                                try {
                                    const trimmedName = name.trim();
                                    const trimmedImage = image.trim();

                                    const payload: { name?: string; image?: string } = {};
                                    if (trimmedName && trimmedName !== user?.name) {
                                        payload.name = trimmedName;
                                    }
                                    if (trimmedImage && trimmedImage !== user?.image) {
                                        payload.image = trimmedImage;
                                    }

                                    // If nothing changed, just exit edit mode
                                    if (!payload.name && !payload.image) {
                                        setIsEditing(false);
                                        setIsSaving(false);
                                        return;
                                    }

                                    const res = await fetch("/api/users/me", {
                                        method: "PATCH",
                                        headers: {
                                            "Content-Type": "application/json",
                                        },
                                        body: JSON.stringify(payload),
                                    });

                                    if (!res.ok) {
                                        const text = await res.text();
                                        throw new Error(text || "Failed to update profile");
                                    }

                                    // Refresh session data
                                    router.refresh();
                                    setIsEditing(false);
                                } catch (err: unknown) {
                                    if (err instanceof Error) {
                                        setError(err.message);
                                    } else {
                                        setError("Failed to update profile");
                                    }
                                } finally {
                                    setIsSaving(false);
                                }
                            }}
                        >
                            <div className="space-y-2">
                                <Label htmlFor="name">Name</Label>
                                <Input
                                    id="name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Your name"
                                    disabled={isSaving || isPending}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="image">Avatar URL</Label>
                                <Input
                                    id="image"
                                    value={image}
                                    onChange={(e) => setImage(e.target.value)}
                                    placeholder="https://example.com/avatar.png"
                                    disabled={isSaving || isPending}
                                />
                            </div>

                            {error && (
                                <p className="text-sm text-destructive">{error}</p>
                            )}

                            <div className="flex gap-2 pt-2">
                                <Button
                                    type="submit"
                                    className="flex-1"
                                    disabled={isSaving || isPending}
                                >
                                    {isSaving ? "Saving..." : "Save changes"}
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="flex-1"
                                    disabled={isSaving}
                                    onClick={() => {
                                        setIsEditing(false);
                                        setError(null);
                                        setName(user?.name ?? "");
                                        setImage(user?.image ?? "");
                                    }}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </form>
                    ) : (
                        <div className="space-y-2">
                            <Button
                                variant="outline"
                                className="w-full justify-start"
                                onClick={() => {
                                    setIsEditing(true);
                                    setName(user?.name ?? "");
                                    setImage(user?.image ?? "");
                                }}
                            >
                                <User className="h-4 w-4 mr-2" />
                                Edit Profile
                            </Button>

                            <div className="flex items-center justify-between w-full px-3 py-2 border rounded-md">
                                <div className="flex items-center gap-2">
                                    <Settings className="h-4 w-4" />
                                    <span className="text-sm font-medium">Theme</span>
                                </div>
                                <ThemeToggle />
                            </div>

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
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}
